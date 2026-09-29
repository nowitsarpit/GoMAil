'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Mail, LayoutDashboard, Send, Users, Users2, Settings, FileText, AtSign,
  Activity, BarChart3, Server, ChevronDown, LogOut,
  UserCircle, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/app/campaigns', label: 'Campaigns', icon: Send },
  { href: '/app/contacts', label: 'Contacts', icon: Users },
  { href: '/app/senders', label: 'Senders', icon: AtSign },
  { href: '/app/templates', label: 'Templates', icon: FileText },
  { href: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/app/activity', label: 'Activity', icon: Activity },
  { href: '/app/operations', label: 'Operations', icon: Server },
  { href: '/app/team', label: 'Team', icon: Users2 },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, organization, role } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      router.replace('/login');
      toast.success('Signed out successfully');
    },
    onError: () => toast.error('Failed to sign out'),
  });

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'linear-gradient(180deg, #0d0f15 0%, #08090d 100%)' }}>
      {/* Brand Header */}
      <div style={{
        padding: '22px 18px 18px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <div style={{
          width: '32px', height: '32px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px -2px rgba(99, 102, 241, 0.5)',
          flexShrink: 0,
        }}>
          <Mail size={16} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.02em', color: '#ffffff' }}>GoMAil</div>
          <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--color-accent-text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ORCHESTRATION
          </div>
        </div>
      </div>

      {/* Organization Badge */}
      {organization && (
        <div style={{
          padding: '12px 16px',
          margin: '12px 10px 4px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Workspace
            </span>
            <span style={{
              fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '100px',
              background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)',
            }}>
              {role}
            </span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {organization.name}
          </div>
        </div>
      )}

      {/* Nav List */}
      <nav style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '8px',
                color: active ? '#ffffff' : 'var(--color-text-secondary)',
                background: active
                  ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%)'
                  : 'transparent',
                fontWeight: active ? 600 : 400,
                fontSize: '13px',
                textDecoration: 'none',
                transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                border: active ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
              }}
            >
              <Icon size={16} color={active ? '#a5b4fc' : 'currentColor'} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {active && (
                <div style={{
                  width: '6px', height: '6px',
                  borderRadius: '50%',
                  background: 'var(--color-accent)',
                  boxShadow: '0 0 8px var(--color-accent)',
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--color-border)', position: 'relative' }}>
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '8px',
            background: userMenuOpen ? 'var(--color-surface-2)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-primary)',
            transition: 'background 0.15s',
          }}
          aria-label="User menu"
          id="user-menu-btn"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              style={{
                width: '30px', height: '30px', borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            />
          ) : (
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e222e 0%, #2a2f40 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserCircle size={18} color="var(--color-text-muted)" />
            </div>
          )}
          <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#f1f3f9' }}>
              {user?.name ?? user?.email ?? 'User'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
          <ChevronDown size={14} color="var(--color-text-muted)" />
        </button>

        {userMenuOpen && (
          <div style={{
            position: 'absolute',
            bottom: '62px',
            left: '10px',
            right: '10px',
            background: '#131620',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.7)',
            zIndex: 100,
            animation: 'fadeIn 0.15s ease-out',
          }}>
            <Link
              href="/app/settings"
              onClick={() => setUserMenuOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px', fontSize: '13px',
                color: 'var(--color-text-secondary)', textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <Settings size={15} /> Settings
            </Link>
            <button
              onClick={() => { setUserMenuOpen(false); logoutMutation.mutate(); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px', fontSize: '13px',
                color: 'var(--color-error)', background: 'none',
                border: 'none', cursor: 'pointer',
                borderTop: '1px solid var(--color-border)',
                textAlign: 'left',
              }}
              id="logout-btn"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--color-surface-0)' }}>
      {/* Desktop sidebar */}
      <aside
        className="desktop-sidebar"
        style={{
          width: '240px',
          flexShrink: 0,
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside style={{
            position: 'relative', width: '270px', zIndex: 1,
            boxShadow: '0 0 40px rgba(0,0,0,0.8)',
          }}>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'absolute', top: '16px', right: '14px',
                background: 'rgba(255, 255, 255, 0.05)', border: 'none',
                borderRadius: '6px', padding: '4px', cursor: 'pointer',
                color: 'var(--color-text-muted)',
              }}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {/* Subtle Ambient Radial Glow */}
        <div
          style={{
            position: 'absolute', top: '-100px', left: '20%', right: '20%', height: '350px',
            background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99, 102, 241, 0.12), transparent 70%)',
            pointerEvents: 'none', zIndex: 0,
          }}
        />

        {/* Mobile Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--color-surface-1)', zIndex: 10,
          }}
          className="mobile-header"
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-primary)' }}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '22px', height: '22px', background: 'var(--color-accent)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={12} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>GoMAil</span>
          </div>
          <div style={{ width: '20px' }} />
        </div>

        <main style={{ flex: 1, overflowY: 'auto', zIndex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
