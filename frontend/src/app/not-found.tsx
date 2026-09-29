import Link from 'next/link';
import { Mail, ArrowLeft, Search } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--color-surface-0)',
      color: 'var(--color-text-primary)',
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid var(--color-border)',
        padding: '0 2rem',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--color-surface-1)',
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
      </nav>

      {/* Center content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          {/* Icon */}
          <div style={{
            width: '56px', height: '56px',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <Search size={24} color="var(--color-text-muted)" />
          </div>

          <p style={{
            fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em',
            color: 'var(--color-accent-text)', textTransform: 'uppercase', marginBottom: '12px',
          }}>
            404
          </p>

          <h1 style={{
            fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em',
            color: '#ffffff', marginBottom: '12px',
          }}>
            Page not found
          </h1>

          <p style={{
            fontSize: '15px', color: 'var(--color-text-secondary)',
            lineHeight: 1.6, marginBottom: '32px',
          }}>
            The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
            Check the URL or navigate back to a known page.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px',
                background: 'var(--color-accent)',
                color: '#ffffff', borderRadius: '8px',
                fontWeight: 600, fontSize: '14px', textDecoration: 'none',
              }}
            >
              <ArrowLeft size={15} /> Go to Home
            </Link>
            <Link
              href="/login"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)', borderRadius: '8px',
                fontWeight: 500, fontSize: '14px', textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
