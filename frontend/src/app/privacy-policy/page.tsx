import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How GoMAil collects, stores, and uses your data. Read our privacy practices covering authentication, campaign data, and session management.',
  robots: { index: true, follow: true },
};

const LAST_UPDATED = '29 September 2026';

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', lineHeight: 1.75, color: 'var(--color-text-secondary)', fontSize: '15px' }}>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>1. Overview</h2>
            <p>
              GoMAil (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Service&rdquo;) is an email campaign orchestration and delivery platform. This Privacy Policy explains
              how we collect, use, store, and protect information when you use the GoMAil application.
            </p>
            <p style={{ marginTop: '12px' }}>
              By using GoMAil, you agree to the practices described in this policy. If you do not agree, you should
              discontinue use of the Service.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>2. Information We Collect</h2>

            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px', marginTop: '16px' }}>Account Information</h3>
            <p>
              When you sign in using Google OAuth, we receive and store your Google account email address, display name,
              profile picture URL, and a stable Google account identifier (&ldquo;sub&rdquo; claim). We do not receive or store
              your Google account password.
            </p>

            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px', marginTop: '16px' }}>Campaign and Contact Data</h3>
            <p>
              GoMAil stores the campaign content, email subject lines, and HTML/plain-text body content you compose.
              Recipient email addresses, names, and any custom fields you import via CSV are stored in our database
              and associated with your organization.
            </p>

            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px', marginTop: '16px' }}>Delivery Events</h3>
            <p>
              We record delivery events for each email dispatched through the platform. These events include queuing,
              processing, sent, failed, and deferred states, along with the provider message ID from the SMTP server
              and timestamps. This data is used exclusively to provide accurate analytics and campaign observability.
            </p>

            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px', marginTop: '16px' }}>Session Data</h3>
            <p>
              When you sign in, we create a server-side session stored in our database. A session token (stored as
              an HttpOnly, Secure cookie) is sent to your browser. This token is never readable by JavaScript.
              Sessions expire after 30 days unless revoked earlier.
            </p>

            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px', marginTop: '16px' }}>Technical Logs</h3>
            <p>
              We collect application logs for operational purposes including IP addresses, user agent strings, request
              paths, and timestamps. These are used for security, debugging, and abuse prevention. Logs are not
              shared with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>3. How We Use Your Information</h2>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>To authenticate you and maintain your session</li>
              <li>To store and execute your email campaigns</li>
              <li>To record and display delivery events and analytics</li>
              <li>To enforce organization membership and role-based permissions</li>
              <li>To prevent abuse, spam, and unauthorized access</li>
              <li>To operate and improve the Service</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              We do not sell your personal data to third parties. We do not use your campaign content or recipient
              data for advertising purposes.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>4. Data Storage and Security</h2>
            <p>
              Data is stored in a managed PostgreSQL database. Sessions and queue state are maintained in Redis.
              Database credentials and API secrets are kept server-side and are never exposed to the browser or
              included in client-side code.
            </p>
            <p style={{ marginTop: '12px' }}>
              Session tokens are stored as SHA-256 hashes in the database. The raw token exists only in your browser
              cookie and is never stored in plaintext.
            </p>
            <p style={{ marginTop: '12px' }}>
              We apply access controls at the organization level: your data is only accessible to users who are
              members of your organization with the appropriate role. Organization boundaries are enforced at the
              database query level.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>5. Third-Party Services</h2>
            <p>GoMAil uses the following third-party services:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Google OAuth</strong> — used for authentication. Google&rsquo;s privacy policy applies to the authentication flow.</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>SMTP Provider</strong> — email is dispatched through a configured SMTP server. Email content passes through that provider&rsquo;s infrastructure.</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Vercel</strong> — frontend hosting. Vercel may collect request logs per their privacy policy.</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Render</strong> — backend and worker hosting. Render may collect service logs per their privacy policy.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>6. Data Retention</h2>
            <p>
              We retain your account information for as long as your account is active. Campaign data, delivery events,
              and contact records are retained for the lifetime of your organization on the platform unless you
              explicitly delete them.
            </p>
            <p style={{ marginTop: '12px' }}>
              If you wish to have your data deleted, contact us at the address listed at the end of this policy.
              We will process deletion requests within a reasonable timeframe.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>7. Cookies</h2>
            <p>
              GoMAil uses a single server-set HttpOnly cookie for session management. This cookie:
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              <li>Is required for the Service to function</li>
              <li>Is not accessible to JavaScript</li>
              <li>Is marked Secure in production (HTTPS only)</li>
              <li>Expires after 30 days or upon sign-out</li>
              <li>Is not used for advertising or tracking</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              We do not use third-party tracking cookies or advertising cookies.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>8. Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data by contacting us. You may
              also revoke your session at any time by signing out, which immediately invalidates your session token.
            </p>
            <p style={{ marginTop: '12px' }}>
              <em style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                Note: GoMAil does not currently make formal compliance claims under GDPR, CCPA, or other specific
                data protection frameworks. If you operate under such frameworks and require a Data Processing Agreement
                or other formal documentation, contact us to discuss requirements.
              </em>
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy as the Service evolves. Material changes will be reflected by an
              updated date at the top of this page. Continued use of the Service after changes constitutes acceptance
              of the updated policy.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>10. Contact</h2>
            <p>
              For privacy-related inquiries or data deletion requests, contact:
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
          <Link href="/terms-and-conditions" style={{ fontSize: '13px', color: 'var(--color-accent-text)', textDecoration: 'none' }}>
            Terms &amp; Conditions
          </Link>
          <Link href="/" style={{ fontSize: '13px', color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
