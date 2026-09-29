import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions governing your use of GoMAil, the email campaign orchestration platform. Covers acceptable use, campaign responsibilities, and service terms.',
  robots: { index: true, follow: true },
};

const LAST_UPDATED = '29 September 2026';

export default function TermsPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--color-surface-0)',
      color: 'var(--color-text-primary)',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid var(--color-border)',
        padding: '0 2rem',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--color-surface-1)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '28px', height: '28px',
            background: 'var(--color-accent)',
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mail size={14} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#ffffff' }}>GoMAil</span>
        </Link>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '13px', color: 'var(--color-text-secondary)', textDecoration: 'none',
        }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '56px 2rem 80px' }}>
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            Legal
          </p>
          <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', marginBottom: '10px' }}>
            Terms &amp; Conditions
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', lineHeight: 1.75, color: 'var(--color-text-secondary)', fontSize: '15px' }}>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>1. Acceptance of Terms</h2>
            <p>
              By accessing or using GoMAil (&ldquo;the Service&rdquo;), you agree to be bound by these Terms and Conditions.
              If you do not agree to these terms, you must not use the Service.
            </p>
            <p style={{ marginTop: '12px' }}>
              These terms constitute a legally binding agreement between you (or the organization you represent)
              and GoMAil.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>2. Description of Service</h2>
            <p>
              GoMAil is an email campaign orchestration and delivery platform. The Service enables you to:
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              <li>Create and manage email campaigns</li>
              <li>Import recipient lists via CSV or manual entry</li>
              <li>Configure sender identities and SMTP settings</li>
              <li>Dispatch campaigns through distributed delivery queues</li>
              <li>Monitor delivery events and campaign analytics</li>
              <li>Manage organization members and permissions</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>3. Account and Organization Responsibilities</h2>
            <p>
              You are responsible for maintaining the security of your account and any organization you create or
              belong to within the Service. You must notify us immediately if you become aware of unauthorized access
              to your account.
            </p>
            <p style={{ marginTop: '12px' }}>
              Organization owners are responsible for managing member access and roles within their workspace.
              You are responsible for all activity that occurs under your account.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>4. Acceptable Use</h2>
            <p>You agree to use the Service only for lawful purposes and in accordance with these terms. You must not use the Service to:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              <li>Send unsolicited bulk email (spam) to recipients who have not consented to receive communications from you</li>
              <li>Violate any applicable laws or regulations, including anti-spam laws (CAN-SPAM, CASL, GDPR requirements, etc.)</li>
              <li>Send phishing, deceptive, or malicious content</li>
              <li>Impersonate another person, organization, or brand</li>
              <li>Distribute malware, viruses, or other harmful code</li>
              <li>Attempt to gain unauthorized access to any system or network</li>
              <li>Circumvent or interfere with the Service&rsquo;s rate limiting, security, or delivery controls</li>
              <li>Use the Service in a way that could damage its reputation or infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>5. Campaign and Email Compliance</h2>
            <p>
              You are solely responsible for the content of emails you send through the Service, compliance with
              applicable email laws and regulations, and maintaining proper consent records for your recipients.
            </p>
            <p style={{ marginTop: '12px' }}>
              GoMAil provides the delivery infrastructure. We do not review email content before it is sent.
              You must ensure that your campaigns comply with all applicable anti-spam laws in the jurisdictions
              where your recipients are located.
            </p>
            <p style={{ marginTop: '12px' }}>
              You must honor unsubscribe requests promptly and maintain an accurate suppression list.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>6. Service Availability</h2>
            <p>
              We aim to provide a reliable service but do not guarantee uninterrupted availability. The Service may
              be unavailable due to scheduled maintenance, infrastructure failures, or circumstances beyond our control.
            </p>
            <p style={{ marginTop: '12px' }}>
              We do not make specific uptime guarantees unless agreed in a separate written agreement.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>7. Intellectual Property</h2>
            <p>
              GoMAil and its associated software, design, and documentation are owned by or licensed to the Service
              operator. Your use of the Service does not grant you ownership of any intellectual property.
            </p>
            <p style={{ marginTop: '12px' }}>
              You retain ownership of the content you create and the data you import. By using the Service, you
              grant us a limited license to store and process that content solely for the purpose of providing the Service.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>8. Third-Party Services</h2>
            <p>
              The Service integrates with third-party services including Google OAuth for authentication and SMTP
              providers for email delivery. Your use of those services is subject to their respective terms and
              privacy policies. GoMAil is not responsible for third-party service outages or policies.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, GoMAil is not liable for any indirect, incidental,
              special, consequential, or punitive damages, including but not limited to loss of profits, data, or
              goodwill, arising from your use of or inability to use the Service.
            </p>
            <p style={{ marginTop: '12px' }}>
              In no event shall our total liability exceed the amount paid by you to us in the twelve months preceding
              the event giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at any time, with or without
              notice, if we determine that you have violated these terms or are using the Service in a manner that
              poses risk to the Service, its users, or third parties.
            </p>
            <p style={{ marginTop: '12px' }}>
              You may terminate your account at any time by contacting us or by ceasing use of the Service.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>11. Modifications to Terms</h2>
            <p>
              We may modify these terms at any time. Material changes will be reflected by an updated date at the
              top of this page. Continued use of the Service after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>12. Governing Law</h2>
            <p>
              <em style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                [Governing law and jurisdiction to be specified based on the legal entity&rsquo;s place of incorporation prior to launch.]
              </em>
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>13. Contact</h2>
            <p>
              For questions about these terms, contact:
            </p>
            <div style={{
              marginTop: '14px',
              padding: '16px 20px',
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '14px',
            }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>GoMAil</strong><br />
              <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                [Legal entity name and contact address to be added prior to launch]
              </span>
            </div>
          </section>

        </div>

        {/* Footer nav */}
        <div style={{
          marginTop: '60px', paddingTop: '24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', gap: '20px', flexWrap: 'wrap',
        }}>
          <Link href="/privacy-policy" style={{ fontSize: '13px', color: 'var(--color-accent-text)', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
          <Link href="/" style={{ fontSize: '13px', color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
