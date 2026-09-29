'use client';

import { useQuery } from '@tanstack/react-query';
import { getCampaigns, getAnalytics, getOperationsStatus } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import {
  Send, CheckCircle2, AlertCircle, Clock, Plus, ArrowRight,
  Sparkles, TrendingUp, AlertTriangle, Mail, Users
} from 'lucide-react';

export default function DashboardPage() {
  const { user, organization } = useAuth();

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns', { pageSize: 5 }],
    queryFn: () => getCampaigns({ pageSize: 5 }),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
  });

  const { data: opsData } = useQuery({
    queryKey: ['operations'],
    queryFn: getOperationsStatus,
    staleTime: 60 * 1000,     // refresh ops status every 60s
    refetchInterval: 60 * 1000,
  });

  const analytics = (analyticsData?.data as any) ?? {};
  const recentCampaigns = campaignsData?.data ?? [];
  const opsStatus = (opsData?.data as any)?.status as string | undefined;

  const pipelineBadge = opsStatus === 'operational'
    ? { color: '#34d399', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)', dot: '#10b981', label: 'All Systems Operational' }
    : opsStatus === 'degraded'
      ? { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)', dot: '#f59e0b', label: 'System Degraded' }
      : { color: 'var(--color-text-muted)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', dot: 'var(--color-text-muted)', label: 'Checking status...' };

  const statusColor: Record<string, { bg: string; text: string; border: string }> = {
    RUNNING: { bg: 'rgba(99, 102, 241, 0.15)', text: '#a5b4fc', border: 'rgba(99, 102, 241, 0.3)' },
    COMPLETED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
    FAILED: { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: 'rgba(244, 63, 94, 0.3)' },
    PAUSED: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
    DRAFT: { bg: 'rgba(255, 255, 255, 0.05)', text: '#9aa4b8', border: 'rgba(255, 255, 255, 0.1)' },
    CANCELLED: { bg: 'rgba(255, 255, 255, 0.03)', text: '#626c82', border: 'rgba(255, 255, 255, 0.06)' },
    SCHEDULED: { bg: 'rgba(14, 165, 233, 0.15)', text: '#38bdf8', border: 'rgba(14, 165, 233, 0.3)' },
  };

  const statCards = [
    {
      label: 'Delivered Messages',
      value: (analytics.summary?.totalSent ?? 0).toLocaleString(),
      icon: <CheckCircle2 size={18} color="#34d399" />,
      sub: 'All-time verified sends',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%)',
    },
    {
      label: 'Dispatched (24h)',
      value: (analytics.summary?.sentLast24h ?? 0).toLocaleString(),
      icon: <TrendingUp size={18} color="#818cf8" />,
      sub: 'Throughput in past 24 hrs',
      gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, transparent 100%)',
    },
    {
      label: 'Failed / Bounced',
      value: (analytics.summary?.totalFailed ?? 0).toLocaleString(),
      icon: <AlertCircle size={18} color="#fb7185" />,
      sub: 'Suppressed & delivery errors',
      gradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, transparent 100%)',
    },
    {
      label: 'Active Campaigns',
      value: (analytics.campaigns?.byStatus?.RUNNING ?? 0).toLocaleString(),
      icon: <Send size={18} color="#fbbf24" />,
      sub: `${analytics.campaigns?.total ?? 0} total campaigns`,
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, transparent 100%)',
    },
  ];

  return (
    <div style={{ padding: '36px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Welcome Header with System Status */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '32px', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
              background: pipelineBadge.bg, border: `1px solid ${pipelineBadge.border}`,
              color: pipelineBadge.color,
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: pipelineBadge.dot, display: 'inline-block' }} />
              {pipelineBadge.label}
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', marginBottom: '4px' }}>
            {user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Dashboard Overview'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            {organization?.name ? `${organization.name} workspace · High-throughput cold email orchestrator` : 'Email campaign orchestration workspace'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href="/app/contacts"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '9px 16px', background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)', borderRadius: '8px',
              fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)',
              textDecoration: 'none', transition: 'all 0.15s',
            }}
          >
            <Users size={14} /> Contacts CSV
          </Link>
          <Link
            href="/app/campaigns"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '9px 18px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              color: '#ffffff', textDecoration: 'none',
              boxShadow: '0 4px 16px -2px rgba(99, 102, 241, 0.4)',
              transition: 'transform 0.15s',
            }}
          >
            <Plus size={15} /> New Campaign
          </Link>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: 'rgba(17, 20, 28, 0.85)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '22px 20px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
              transition: 'transform 0.2s, border-color 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '100px',
              background: card.gradient, pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', position: 'relative' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {card.label}
              </span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', marginBottom: '6px', position: 'relative' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', position: 'relative' }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Launch / Setup Guide Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
            flexShrink: 0,
          }}>
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>
              Ready to send cold emails at scale?
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Follow the cold outreach workflow: 1. Add Sender → 2. Import CSV Contacts → 3. Compose Template → 4. Launch Campaign.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            href="/app/senders"
            style={{
              padding: '7px 14px', background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)', borderRadius: '6px',
              fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)', textDecoration: 'none',
            }}
          >
            Manage Senders
          </Link>
          <Link
            href="/app/campaigns"
            style={{
              padding: '7px 14px', background: 'var(--color-accent)',
              borderRadius: '6px', fontSize: '12px', fontWeight: 600,
              color: '#ffffff', textDecoration: 'none',
            }}
          >
            Launch Campaign →
          </Link>
        </div>
      </div>

      {/* Recent Campaigns Section */}
      <div style={{
        background: 'rgba(17, 20, 28, 0.85)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Recent Campaigns</h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Latest campaign dispatches and delivery performance</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              href="/app/campaigns"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '13px', fontWeight: 500, color: 'var(--color-accent-text)',
                textDecoration: 'none',
              }}
            >
              View all campaigns <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {recentCampaigns.length === 0 ? (
          <div style={{ padding: '56px 20px', textAlign: 'center' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Send size={22} color="var(--color-text-muted)" />
            </div>
            <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', color: '#ffffff' }}>No campaigns launched yet</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '20px', maxWidth: '380px', margin: '0 auto 20px' }}>
              Create your first email campaign, import contacts via CSV, and dispatch via BullMQ.
            </p>
            <Link
              href="/app/campaigns"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '9px 20px', background: 'var(--color-accent)',
                borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                color: '#ffffff', textDecoration: 'none',
              }}
            >
              <Plus size={14} /> Create First Campaign
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255, 255, 255, 0.01)' }}>
                {['Campaign Name', 'Status', 'Recipients', 'Delivery Progress', 'Created'].map((col) => (
                  <th key={col} style={{
                    padding: '12px 20px', textAlign: 'left', fontSize: '11px',
                    fontWeight: 600, color: 'var(--color-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentCampaigns.map((c: any, i: number) => {
                const cfg = statusColor[c.status] ?? statusColor['DRAFT']!;
                const pct = c.totalRecipients > 0 ? Math.round((c.sentCount / c.totalRecipients) * 100) : 0;
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: i < recentCampaigns.length - 1 ? '1px solid var(--color-border)' : 'none',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <Link
                        href={`/app/campaigns/${c.id}`}
                        style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}
                      >
                        {c.name}
                      </Link>
                      {c.subject && (
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                          {c.subject}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
                        background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
                      }}>
                        {c.status === 'RUNNING' && (
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', animation: 'pulse 1.5s infinite' }} />
                        )}
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      {c.totalRecipients.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '160px' }}>
                        <div style={{
                          flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.06)',
                          borderRadius: '100px', overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${pct}%`, height: '100%',
                            background: c.failedCount > 0 && c.sentCount === 0 ? 'var(--color-error)' : 'linear-gradient(90deg, #6366f1, #10b981)',
                            borderRadius: '100px',
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', width: '36px' }}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
