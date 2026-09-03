'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAuthStatus } from '@/lib/api';
import { Mail, AlertCircle, ShieldCheck, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const [status, setStatus] = useState<{ oauthConfigured: boolean; configurationUrl?: string | null; provider?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:5000';

  useEffect(() => {
    getAuthStatus()
      .then((data) => setStatus(data))
      .catch(() => setStatus({ oauthConfigured: false }))
      .finally(() => setLoading(false));
  }, []);

  const errorMessages: Record<string, string> = {
    auth_failed: 'Authentication failed with Google. Please try again.',
    invalid_callback: 'Invalid callback parameters from Google.',
    invalid_state: 'Session state expired. Please sign in again.',
    access_denied: 'You denied permission to access your Google account.',
    unauthorized: 'You must be signed in to access that page.',
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99, 102, 241, 0.18), transparent 70%), var(--color-surface-0)',
      display: 'flex',
      flexDirection: 'column',
      color: 'var(--color-text-primary)',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top Brand Bar */}
      <header style={{
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px -2px rgba(99, 102, 241, 0.5)',
          }}>
            <Mail size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em', color: '#ffffff' }}>GoMAil</span>
        </Link>

        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
          background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
          color: 'var(--color-text-secondary)',
        }}>
          <ShieldCheck size={13} color="#34d399" />
          Zero Mock Data Guarantee
        </span>
      </header>

      {/* Center Auth Card */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        zIndex: 10,
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(17, 20, 28, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '44px 36px',
          boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px -4px rgba(99, 102, 241, 0.4)',
            }}>
              <Lock size={22} color="#818cf8" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', marginBottom: '6px' }}>
              Sign in to GoMAil
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Cold Email Campaign Orchestration & Delivery
            </p>
          </div>

          {error && (
            <div style={{
              padding: '12px 14px',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}>
              <AlertCircle size={16} color="var(--color-error)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '12px', color: '#fda4af', lineHeight: 1.4 }}>
                {errorMessages[error] ?? 'An error occurred during authentication.'}
              </p>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              Verifying security configuration...
            </div>
          ) : !status?.oauthConfigured ? (
            <div style={{
              padding: '14px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <AlertCircle size={15} color="var(--color-warning)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <p style={{ fontSize: '12px', color: '#fde68a', lineHeight: 1.4 }}>
                  OAuth credentials are not configured in backend/.env.
                </p>
              </div>
            </div>
          ) : null}

          {/* Google Sign In Button */}
          <a
            href={`${API_URL}/api/v1/auth/google`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              padding: '13px 20px',
              background: status?.oauthConfigured ? '#ffffff' : 'var(--color-surface-2)',
              color: status?.oauthConfigured ? '#0f172a' : 'var(--color-text-muted)',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
              cursor: status?.oauthConfigured ? 'pointer' : 'not-allowed',
              pointerEvents: status?.oauthConfigured ? 'auto' : 'none',
              boxShadow: status?.oauthConfigured ? '0 4px 16px rgba(0, 0, 0, 0.25)' : 'none',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            id="google-signin-btn"
          >
            {/* Google G logo */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.07 17.64 11.867 17.64 9.2z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </a>

          <div style={{ marginTop: '28px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} color="#34d399" /> Enterprise OIDC
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} color="#34d399" /> 256-bit PKCE
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} color="#34d399" /> Multi-Tenant
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-surface-0)' }} />}>
      <LoginContent />
    </Suspense>
  );
}
