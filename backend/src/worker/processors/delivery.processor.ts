import type { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { EtherealMailProvider } from '../../providers/mail/EtherealMailProvider.js';
import {
  checkOrgRateLimit,
  checkSenderRateLimit,
} from '../../lib/rateLimiter.js';

const LEASE_TIMEOUT_MS = parseInt(process.env['LEASE_TIMEOUT_MS'] ?? '60000');

// Shared Prisma instance in the worker process
const prisma = new PrismaClient();

// Shared mail provider (lazy-initialised, handles its own credential rotation)
const mailProvider = new EtherealMailProvider();

// ─── Error classification ─────────────────────────────────────────────────

type ErrorClass = 'RETRYABLE' | 'PERMANENT';

function classifyError(err: unknown): ErrorClass {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();

  // Permanent failures — do not retry
  const permanentSignals = [
    'invalid email',
    'user unknown',
    'address rejected',
    '550 ',
    '551 ',
    '552 ',
    '553 ',
    '554 ',
    '5.1.1',
    '5.1.2',
    'no such user',
    'does not exist',
  ];
  if (permanentSignals.some((s) => msg.includes(s))) return 'PERMANENT';

  // Retryable failures (network, timeouts, rate limits, temp errors)
  return 'RETRYABLE';
}

// ─── Personalization ──────────────────────────────────────────────────────

function applyPersonalization(
  template: string,
  vars: Record<string, string | null | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    return vars[key] ?? '';
  });
}

// ─── Main Delivery Processor ──────────────────────────────────────────────

export async function processDeliveryJob(job: Job): Promise<void> {
  const { campaignId, recipientId, organizationId, idempotencyKey } = job.data as {
    campaignId: string;
    recipientId: string;
    organizationId: string;
    idempotencyKey: string;
  };

  console.info(`[Worker] Processing job ${job.id} — recipient ${recipientId}`);

  // ── Step 1: Load and verify campaign ────────────────────────────────────
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, organizationId },
    include: { sender: true },
  });

  if (!campaign) {
    console.warn(`[Worker] Campaign ${campaignId} not found — skipping`);
    return;
  }

  // ── Step 2: Check campaign is not cancelled/paused ────────────────────
  if (campaign.status === 'CANCELLED') {
    console.info(`[Worker] Campaign ${campaignId} is CANCELLED — skipping`);
    await prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: { status: 'CANCELLED', processedAt: new Date() },
    });
    return;
  }

  if (campaign.status === 'PAUSED') {
    // Re-queue with a delay — worker checks again later
    throw Object.assign(new Error('Campaign is PAUSED'), { retryable: true });
  }

  // ── Step 3: Load recipient ───────────────────────────────────────────
  const recipient = await prisma.campaignRecipient.findFirst({
    where: { id: recipientId, campaignId },
  });

  if (!recipient) {
    console.warn(`[Worker] Recipient ${recipientId} not found — skipping`);
    return;
  }

  // ── Step 4: Idempotency check ────────────────────────────────────────
  if (recipient.status === 'SENT') {
    console.info(`[Worker] Recipient ${recipientId} already SENT — skipping (idempotent)`);
    return;
  }

  if (['FAILED', 'CANCELLED', 'SUPPRESSED'].includes(recipient.status)) {
    console.info(`[Worker] Recipient ${recipientId} is ${recipient.status} — skipping`);
    return;
  }

  // ── Step 5: Suppression check ─────────────────────────────────────────
  const suppressed = await prisma.suppression.findFirst({
    where: { organizationId, email: recipient.email },
  });

  if (suppressed) {
    await prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: { status: 'SUPPRESSED', processedAt: new Date() },
    });
    await updateCampaignAggregates(campaignId);
    return;
  }

  // ── Step 6: Acquire processing lease ─────────────────────────────────
  const leaseExpiresAt = new Date(Date.now() + LEASE_TIMEOUT_MS);

  const acquired = await prisma.campaignRecipient.updateMany({
    where: {
      id: recipientId,
      status: { in: ['PENDING', 'SCHEDULED', 'DEFERRED'] },
    },
    data: { status: 'PROCESSING', processedAt: new Date() },
  });

  if (acquired.count === 0) {
    // Another worker is processing this — skip
    console.info(`[Worker] Recipient ${recipientId} already being processed — skipping`);
    return;
  }

  // Also upsert the delivery job
  const deliveryJob = await prisma.deliveryJob.upsert({
    where: { idempotencyKey },
    create: {
      campaignId,
      organizationId,
      recipientId,
      idempotencyKey,
      status: 'PROCESSING',
      bullJobId: job.id ?? undefined,
      processingAt: new Date(),
      leaseExpiresAt,
      attempt: (job.attemptsMade ?? 0) + 1,
    },
    update: {
      status: 'PROCESSING',
      processingAt: new Date(),
      leaseExpiresAt,
      attempt: { increment: 1 },
    },
  });

  // ── Step 7: Rate limiting ─────────────────────────────────────────────
  // Enforce org-level and sender-level hourly send limits via shared Redis Lua scripts.
  const [orgLimit, senderLimit] = await Promise.all([
    checkOrgRateLimit(organizationId),
    campaign.senderId
      ? checkSenderRateLimit(organizationId, campaign.senderId)
      : Promise.resolve({ allowed: true } as any),
  ]);

  if (!orgLimit.allowed) {
    console.warn(`[Worker] Org rate limit hit for ${organizationId} — deferring`);
    await markFailed(recipientId, deliveryJob.id, campaignId, organizationId, 'RETRYABLE', 'Org hourly rate limit exceeded');
    throw new Error('Org rate limit exceeded — will retry');
  }

  if (!senderLimit.allowed) {
    console.warn(`[Worker] Sender rate limit hit for sender ${campaign.senderId} — deferring`);
    await markFailed(recipientId, deliveryJob.id, campaignId, organizationId, 'RETRYABLE', 'Sender hourly rate limit exceeded');
    throw new Error('Sender rate limit exceeded — will retry');
  }

  // ── Step 8: Compose personalized message ─────────────────────────────
  if (!campaign.subject || !campaign.htmlBody || !campaign.sender) {
    await markFailed(recipientId, deliveryJob.id, campaignId, organizationId, 'PERMANENT', 'Campaign missing subject/body/sender');
    return;
  }

  const vars = {
    firstName: recipient.firstName,
    lastName: recipient.lastName,
    company: recipient.company,
    email: recipient.email,
  };

  const personalizedSubject = applyPersonalization(campaign.subject, vars);
  const personalizedHtml = applyPersonalization(campaign.htmlBody, vars);
  const personalizedText = campaign.textBody ? applyPersonalization(campaign.textBody, vars) : undefined;

  // ── Step 9: Send email via provider ──────────────────────────────────
  let messageId: string | undefined;

  try {
    // Log the SMTP boundary: if SMTP accepts and we crash before DB update,
    // we cannot know for certain whether the message was delivered.
    // GoMAil provides deterministic logical identity but cannot guarantee
    // physically exactly-once SMTP delivery across crash boundaries.
    const result = await mailProvider.send({
      from: campaign.sender.email,
      fromName: campaign.sender.name ?? undefined,
      to: recipient.email,
      replyTo: campaign.sender.replyTo ?? undefined,
      subject: personalizedSubject,
      html: personalizedHtml,
      text: personalizedText,
      // Pass identifiers for custom headers in the provider
      ...(({ jobId: idempotencyKey, campaignId } as any)),
    });

    messageId = result.messageId;

  } catch (err) {
    const errorClass = classifyError(err);
    const message = err instanceof Error ? err.message : String(err);

    console.error(`[Worker] Send failed (${errorClass}): ${message}`);
    await markFailed(recipientId, deliveryJob.id, campaignId, organizationId, errorClass, message);

    if (errorClass === 'PERMANENT') {
      // Don't retry permanent failures
      return;
    }

    // Re-throw retryable errors — BullMQ will retry with backoff
    throw err;
  }

  // ── Step 10: Mark SENT (SMTP boundary: if we crash here, message was sent
  //            but DB won't reflect it. Recovery must handle this case.) ─
  await prisma.$transaction([
    prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: { status: 'SENT', processedAt: new Date() },
    }),
    prisma.deliveryJob.update({
      where: { id: deliveryJob.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        leaseExpiresAt: null,
        providerMessageId: messageId,
      },
    }),
    prisma.deliveryEvent.create({
      data: {
        campaignId,
        organizationId,
        jobId: deliveryJob.id,
        event: 'sent',
        metadata: { messageId, attempt: job.attemptsMade },
      },
    }),
  ]);

  await updateCampaignAggregates(campaignId);
  console.info(`[Worker] Delivered to ${recipient.email} (${messageId})`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────

async function markFailed(
  recipientId: string,
  jobId: string,
  campaignId: string,
  organizationId: string,
  errorClass: 'RETRYABLE' | 'PERMANENT',
  message: string
): Promise<void> {
  const finalStatus = errorClass === 'PERMANENT' ? 'FAILED' : 'DEFERRED';

  await prisma.$transaction([
    prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: { status: finalStatus },
    }),
    prisma.deliveryJob.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        failedAt: new Date(),
        lastError: message,
        lastErrorCode: errorClass,
      },
    }),
    prisma.deliveryEvent.create({
      data: {
        campaignId,
        organizationId,          // ← fixed: was (prisma as any)._engineConfig?.datasourceUrl
        jobId,
        event: errorClass === 'PERMANENT' ? 'failed' : 'deferred',
        metadata: { error: message, errorClass },
      },
    }),
  ]).catch((err) => {
    // best-effort — log and continue; the job will surface in recovery
    console.error('[Worker] markFailed transaction error:', err);
  });

  await updateCampaignAggregates(campaignId);
}

async function updateCampaignAggregates(campaignId: string): Promise<void> {
  try {
    const counts = await prisma.campaignRecipient.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: { id: true },
    });

    const byStatus = counts.reduce((acc, c) => ({
      ...acc, [c.status]: c._count.id,
    }), {} as Record<string, number>);

    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
    const sent = byStatus['SENT'] ?? 0;
    const failed = byStatus['FAILED'] ?? 0;
    const cancelled = byStatus['CANCELLED'] ?? 0;
    const suppressed = byStatus['SUPPRESSED'] ?? 0;

    const completed = sent + failed + cancelled + suppressed === total && total > 0;

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        sentCount: sent,
        failedCount: failed,
        cancelledCount: cancelled,
        pendingCount: byStatus['PENDING'] ?? 0,
        processingCount: byStatus['PROCESSING'] ?? 0,
        deferredCount: byStatus['DEFERRED'] ?? 0,
        scheduledCount: byStatus['SCHEDULED'] ?? 0,
        ...(completed ? { status: 'COMPLETED', completedAt: new Date() } : {}),
      },
    });
  } catch (err) {
    console.error('[Worker] Failed to update aggregates:', err);
  }
}
