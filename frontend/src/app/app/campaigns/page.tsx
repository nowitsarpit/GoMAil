'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCampaigns, createCampaign, deleteCampaign, launchCampaign, pauseCampaign, resumeCampaign, cancelCampaign } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Plus, Search, Send, Pause, Play, X, Trash2, Eye,
  Loader2, Filter, Sparkles, CheckCircle2, AlertCircle
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  RUNNING: { bg: 'rgba(99, 102, 241, 0.15)', text: '#a5b4fc', border: 'rgba(99, 102, 241, 0.3)' },
  COMPLETED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
  FAILED: { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: 'rgba(244, 63, 94, 0.3)' },
  PAUSED: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
  DRAFT: { bg: 'rgba(255, 255, 255, 0.05)', text: '#9aa4b8', border: 'rgba(255, 255, 255, 0.1)' },
  CANCELLED: { bg: 'rgba(255, 255, 255, 0.03)', text: '#626c82', border: 'rgba(255, 255, 255, 0.06)' },
  SCHEDULED: { bg: 'rgba(14, 165, 233, 0.15)', text: '#38bdf8', border: 'rgba(14, 165, 233, 0.3)' },
};

export default function CampaignsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', { search, status: statusFilter, page }],
    queryFn: () => getCampaigns({ search, status: statusFilter, page, pageSize: 20 }),
  });

  const campaigns = data?.data ?? [];
  const pagination = data?.pagination;

  const createMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created');
      setShowNew(false);
      setNewName('');
      setNewDesc('');
      router.push(`/app/campaigns/${res.data.id}`);
    },
    onError: () => toast.error('Failed to create campaign'),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      if (action === 'launch') return launchCampaign(id);
      if (action === 'pause') return pauseCampaign(id);
      if (action === 'resume') return resumeCampaign(id);
      if (action === 'cancel') return cancelCampaign(id);
      if (action === 'delete') return deleteCampaign(id);
      throw new Error('Unknown action');
    },
    onSuccess: (_r, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(`Campaign ${action}ed successfully`);
    },
    onError: (err: any) => toast.error(err?.message ?? 'Action failed'),
  });

  return (
    <div style={{ padding: '36px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', marginBottom: '4px' }}>
            Campaigns
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {pagination?.total ?? 0} total campaigns · Full state machine with BullMQ guarantees
          </p>
        </div>

        <button
          onClick={() => setShowNew(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
            color: '#ffffff', cursor: 'pointer',
            boxShadow: '0 4px 16px -2px rgba(99, 102, 241, 0.4)',
            transition: 'transform 0.15s',
          }}
          id="new-campaign-btn"
        >
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search campaigns by name..."
            style={{
              width: '100%', padding: '9px 12px 9px 36px',
              background: 'var(--color-surface-1)', border: '1px solid var(--color-border)',
              borderRadius: '8px', color: 'var(--color-text-primary)', fontSize: '13px',
            }}
          />
        </div>

        {/* Status Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { label: 'All', val: '' },
            { label: 'Running', val: 'RUNNING' },
            { label: 'Draft', val: 'DRAFT' },
            { label: 'Completed', val: 'COMPLETED' },
            { label: 'Paused', val: 'PAUSED' },
            { label: 'Failed', val: 'FAILED' },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => { setStatusFilter(f.val); setPage(1); }}
              style={{
                padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600,
                border: `1px solid ${statusFilter === f.val ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: statusFilter === f.val ? 'rgba(99, 102, 241, 0.15)' : 'var(--color-surface-1)',
                color: statusFilter === f.val ? '#a5b4fc' : 'var(--color-text-muted)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Table Card */}
      <div style={{
        background: 'rgba(17, 20, 28, 0.85)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px -2px rgba(0, 0, 0, 0.4)',
      }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
            Loading campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Send size={22} color="var(--color-text-muted)" />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: '#ffffff' }}>No campaigns found</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
              {search || statusFilter ? 'Try clearing your search or status filters.' : 'Create your first email campaign to begin sending.'}
            </p>
            <button
              onClick={() => setShowNew(true)}
              style={{
                padding: '9px 18px', background: 'var(--color-accent)',
                border: 'none', borderRadius: '8px', color: 'white',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Plus size={14} style={{ display: 'inline', marginRight: '6px' }} /> Create Campaign
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255, 255, 255, 0.01)' }}>
                {['Name', 'Status', 'Recipients', 'Progress', 'Delivery Mode', 'Created', 'Actions'].map((c) => (
                  <th key={c} style={{
                    padding: '12px 18px', textAlign: 'left', fontSize: '11px',
                    fontWeight: 600, color: 'var(--color-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c: any, i: number) => {
                const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG['DRAFT']!;
                const pct = c.totalRecipients > 0 ? Math.round((c.sentCount / c.totalRecipients) * 100) : 0;
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: i < campaigns.length - 1 ? '1px solid var(--color-border)' : 'none',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <Link
                        href={`/app/campaigns/${c.id}`}
                        style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 600, fontSize: '14px', display: 'block' }}
                      >
                        {c.name}
                      </Link>
                      {c.description && (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{c.description}</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
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
                    <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      {c.totalRecipients.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: '100px' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {c.deliveryMode === 'FIXED_GAP' ? `Throttled (${c.delayMs ?? 0}ms)` : 'Immediate'}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Link
                          href={`/app/campaigns/${c.id}`}
                          style={{
                            padding: '6px 10px', background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)', borderRadius: '6px',
                            color: 'var(--color-text-primary)', fontSize: '12px', textDecoration: 'none',
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                          }}
                        >
                          <Eye size={12} /> View
                        </Link>
                        {c.status === 'READY' && (
                          <button
                            onClick={() => actionMutation.mutate({ id: c.id, action: 'launch' })}
                            style={{ padding: '6px 10px', background: 'var(--color-accent)', border: 'none', borderRadius: '6px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Play size={12} /> Launch
                          </button>
                        )}
                        {c.status === 'RUNNING' && (
                          <button
                            onClick={() => actionMutation.mutate({ id: c.id, action: 'pause' })}
                            style={{ padding: '6px 10px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', color: '#fbbf24', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Pause size={12} /> Pause
                          </button>
                        )}
                        {c.status === 'PAUSED' && (
                          <button
                            onClick={() => actionMutation.mutate({ id: c.id, action: 'resume' })}
                            style={{ padding: '6px 10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', color: '#34d399', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Play size={12} /> Resume
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* New Campaign Modal */}
      {showNew && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px',
        }}>
          <div style={{
            background: 'var(--color-surface-1)', border: '1px solid var(--color-border)',
            borderRadius: '12px', width: '100%', maxWidth: '480px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.6)', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid var(--color-border)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Create New Campaign</h2>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (newName.trim()) createMutation.mutate({ name: newName, description: newDesc || undefined }); }} style={{ padding: '22px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Campaign Name *
                </label>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Q4 Growth Outreach"
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '14px' }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Description (Optional)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Target audience, strategy, notes..."
                  rows={3}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '13px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowNew(false)} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !newName.trim()}
                  style={{
                    padding: '8px 20px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    border: 'none', borderRadius: '6px', color: 'white', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', opacity: createMutation.isPending || !newName.trim() ? 0.6 : 1,
                  }}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create & Configure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
