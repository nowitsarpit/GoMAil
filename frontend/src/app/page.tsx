import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Mail, Zap, BarChart3, Shield, Users, Clock,
  ArrowRight, CheckCircle2, Sparkles, FileSpreadsheet,
  Server, Lock, Play
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'GoMAil — Plan. Deliver. Observe.',
  description: 'Enterprise email campaign orchestration and delivery platform.',
};

export default function LandingPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--color-surface-0)',
      color: 'var(--color-text-primary)',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Top Ambient Light Glow */}
      <div style={{
        position: 'absolute', top: '-120px', left: '15%', right: '15%', height: '500px',
        background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99, 102, 241, 0.22), transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid var(--color-border)',
        padding: '0 2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '68px',
        position: 'sticky',
        top: 0,
        background: 'rgba(8, 9, 13, 0.85)',
        backdropFilter: 'blur(16px)',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px -2px rgba(99, 102, 241, 0.5)',
          }}>
            <Mail size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.02em', color: '#ffffff' }}>GoMAil</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            href="/login"
            style={{
              padding: '8px 16px',
              color: 'var(--color-text-secondary)',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
          >
            Sign In
          </Link>
          <Link
            href="/login"
            style={{
              padding: '8px 18px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              textDecoration: 'none',
              boxShadow: '0 4px 16px -2px rgba(99, 102, 241, 0.4)',
              transition: 'transform 0.15s',
            }}
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '100px 2rem 60px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '100px',
          fontSize: '12px',
          color: '#a5b4fc',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginBottom: '28px',
        }}>
          <Sparkles size={14} color="#a5b4fc" />
          Enterprise Cold Email Orchestration
        </div>

        <h1 style={{
          fontSize: 'clamp(40px, 6.5vw, 68px)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          marginBottom: '24px',
          color: '#ffffff',
        }}>
          Plan Campaigns. Deliver at Scale.{' '}
          <span style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Observe Pure Truth.
          </span>
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'var(--color-text-secondary)',
          maxWidth: '640px',
          margin: '0 auto 40px',
          lineHeight: 1.6,
        }}>
          Production-grade cold email orchestration powered by PostgreSQL transactional outboxes,
          BullMQ queue concurrency, deterministic SHA-256 idempotency, and a complete CSV power suite.
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/login"
            style={{
              padding: '13px 28px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '15px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px -2px rgba(99, 102, 241, 0.5)',
            }}
          >
            Launch Free Console <ArrowRight size={16} />
          </Link>

          <a
            href="https://github.com/nowitsarpit/GoMAil"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '13px 24px',
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '15px',
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* Interactive Mock Pipeline Preview Card */}
      <section style={{ maxWidth: '980px', margin: '0 auto 100px', padding: '0 2rem', position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'rgba(15, 17, 24, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.7)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginLeft: '10px', fontFamily: 'var(--font-mono)' }}>
                gomail-pipeline :: active-dispatch
              </span>
            </div>
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '100px',
              background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)',
            }}>
              ● Live 1,200/min Throughput
            </span>
          </div>

          {/* 4-Step Pipeline Flow */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {[
              { step: '01. Ingestion', title: 'CSV & Column Mapping', desc: 'Drag-and-drop parser with instant RFC validation & duplicate skip.' },
              { step: '02. Outbox Lock', title: 'Transactional Postgres', desc: 'Campaign state committed in atomic tx with OutboxEvent.' },
              { step: '03. Distributed Queue', title: 'BullMQ & Redis', desc: 'Deterministic SHA-256 IDs prevent double sends across crashes.' },
              { step: '04. SMTP Dispatch', title: 'Verified Delivery Event', desc: 'Concrete message ID stored with millisecond latency.' },
            ].map((p, i) => (
              <div key={p.step} style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '16px',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent-text)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {p.step}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                  {p.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  {p.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', marginBottom: '8px' }}>
            Engineered for Cold Outreach Reliability
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>
            Every architectural decision prioritizes zero dropped emails, zero double-sends, and honest metrics.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}>
          {[
            {
              icon: <FileSpreadsheet size={22} color="#818cf8" />,
              title: 'CSV Power Suite',
              desc: 'Drag & drop CSV upload, smart column mapping (email, name, company), live pre-upload preview table, and 1-click template downloads.',
            },
            {
              icon: <Zap size={22} color="#fbbf24" />,
              title: 'BullMQ Distributed Engine',
              desc: 'High-throughput delivery queue with atomic concurrency leases, hourly rate limits per sender, and automated crash recovery.',
            },
            {
              icon: <Shield size={22} color="#34d399" />,
              title: 'Deterministic SHA-256 Idempotency',
              desc: 'Duplicate sends are mathematically impossible. Job IDs are derived from SHA-256(campaignId + normalizedEmail).',
            },
            {
              icon: <BarChart3 size={22} color="#38bdf8" />,
              title: 'Pure Truth Observability',
              desc: 'No fabricated or simulated charts. Every statistic is aggregated from physical DeliveryEvent records in PostgreSQL.',
            },
            {
              icon: <Users size={22} color="#c084fc" />,
              title: 'Multi-Tenant RBAC Security',
              desc: 'Organization boundaries enforced at the query level. Strict role hierarchies: OWNER, ADMIN, OPERATOR, MEMBER, VIEWER.',
            },
            {
              icon: <Clock size={22} color="#fb7185" />,
              title: 'Campaign State Machine',
              desc: 'Explicit legal transitions only: DRAFT → READY → RUNNING → PAUSED → COMPLETED. No invalid or corrupted states.',
            },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                background: 'rgba(17, 20, 28, 0.8)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '28px',
                boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '32px 2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '13px',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'var(--color-surface-0)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '22px', height: '22px', background: 'var(--color-accent)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={12} color="white" />
          </div>
          <span>© 2026 GoMAil. Plan. Deliver. Observe.</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/login" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
            Console Sign In
          </Link>
          <a href="https://github.com/nowitsarpit/GoMAil" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
            GitHub Repository
          </a>
        </div>
      </footer>
    </main>
  );
}
