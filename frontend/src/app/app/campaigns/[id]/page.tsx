'use client';

import { useState, useEffect, useRef } from 'react';
import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCampaign, updateCampaign, launchCampaign, pauseCampaign, resumeCampaign,
  cancelCampaign, getSenders, importRecipients, getCampaignRecipients, exportRecipientsCsv
} from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Send, Pause, Play, X, Save, Upload, Download, FileText,
  ChevronDown, AlertCircle, CheckCircle, Clock, Loader2, Filter, Search,
  Check, AlertTriangle, RefreshCw, Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'var(--color-text-muted)', READY: 'var(--color-info)', RUNNING: 'var(--color-accent)',
  PAUSED: 'var(--color-warning)', COMPLETED: 'var(--color-success)',
  CANCELLED: 'var(--color-text-disabled)', FAILED: 'var(--color-error)',
};

function parseCsvSimple(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const rawHeaders = parseRow(lines[0] || '');
  const headers = rawHeaders.map(h => h.replace(/^["']|["']$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseRow(lines[i] || '');
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (vals[idx] || '').replace(/^["']|["']$/g, '');
    });
    rows.push(obj);
  }
  return { headers, rows };
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'content' | 'recipients' | 'progress'>('content');
  const [localForm, setLocalForm] = useState({ name: '', subject: '', htmlBody: '', textBody: '', senderId: '', deliveryMode: 'IMMEDIATE' as string, delayMs: 0 });
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');
  const [pastedEmails, setPastedEmails] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
  });
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientStatusFilter, setRecipientStatusFilter] = useState('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const sseRef = useRef<EventSource | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => getCampaign(id),
  });

  const campaign = data?.data;

  const { data: sendersData } = useQuery({ queryKey: ['senders'], queryFn: getSenders });
  const senders = sendersData?.data ?? [];

  const { data: recipientsData } = useQuery({
    queryKey: ['campaign-recipients', id],
    queryFn: () => getCampaignRecipients(id),
    enabled: activeTab === 'recipients',
  });

  useEffect(() => {
    if (campaign) {
      setLocalForm({
        name: campaign.name,
        subject: campaign.subject ?? '',
        htmlBody: campaign.htmlBody ?? '',
        textBody: '',
        senderId: campaign.senderId ?? '',
        deliveryMode: campaign.deliveryMode ?? 'IMMEDIATE',
        delayMs: campaign.delayMs ?? 1000,
      });
    }
  }, [campaign?.id]);

  // SSE for live progress
  useEffect(() => {
    if (activeTab !== 'progress' || !campaign || !['RUNNING', 'PAUSED'].includes(campaign.status)) return;
    const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:5000';
    const es = new EventSource(`${API}/api/v1/campaigns/${id}/progress`, { withCredentials: true });
    es.onmessage = (e) => { try { setProgress(JSON.parse(e.data)); } catch {} };
    sseRef.current = es;
    return () => { es.close(); sseRef.current = null; };
  }, [activeTab, campaign?.status]);

  const saveMutation = useMutation({
    mutationFn: () => updateCampaign(id, {
      name: localForm.name, subject: localForm.subject,
      htmlBody: localForm.htmlBody,
      senderId: localForm.senderId || undefined,
      deliveryMode: localForm.deliveryMode as any,
      delayMs: localForm.delayMs > 0 ? localForm.delayMs : undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['campaign', id] }); toast.success('Campaign saved'); },
    onError: (e: any) => toast.error(e?.message ?? 'Save failed'),
  });

  const actionMutation = useMutation({
    mutationFn: async (action: string) => {
      if (action === 'launch') return launchCampaign(id);
      if (action === 'pause') return pauseCampaign(id);
      if (action === 'resume') return resumeCampaign(id);
      if (action === 'cancel') return cancelCampaign(id);
      throw new Error('Unknown');
    },
    onSuccess: (_r, action) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(`Campaign ${action}ed`);
    },
    onError: (e: any) => toast.error(e?.message ?? 'Action failed'),
  });

  const handleFileChange = async (file: File | null) => {
    setImportFile(file);
    if (!file) {
      setCsvHeaders([]);
      setCsvRows([]);
      return;
    }

    try {
      const text = await file.text();
      const { headers, rows } = parseCsvSimple(text);
      setCsvHeaders(headers);
      setCsvRows(rows);

      // Auto-detect column mappings
      const lowerHeaders = headers.map((h) => h.toLowerCase());
      const findBest = (patterns: string[]) => {
        for (const p of patterns) {
          const idx = lowerHeaders.findIndex((h) => h.includes(p));
          if (idx !== -1) return headers[idx];
        }
        return '';
      };

      setColumnMapping({
        email: findBest(['email', 'mail', 'e-mail']) || (headers[0] ?? ''),
        firstName: findBest(['first_name', 'firstname', 'first', 'fname']),
        lastName: findBest(['last_name', 'lastname', 'last', 'lname', 'surname']),
        company: findBest(['company', 'org', 'organization', 'business', 'firm']),
      });
    } catch {
      toast.error('Failed to parse CSV preview');
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent =
      'email,firstName,lastName,company\nalice@example.com,Alice,Smith,Acme Corp\nbob@techflow.io,Bob,Jones,TechFlow Inc\ncharlie@venture.co,Charlie,Brown,Venture Labs';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_recipients_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Sample CSV template downloaded');
  };

  const handleExportRecipients = async () => {
    if (!campaign) return;
    setIsExporting(true);
    try {
      const blob = await exportRecipientsCsv(campaign.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${campaign.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_recipients.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Recipients exported to CSV');
    } catch {
      toast.error('Failed to export recipients');
    } finally {
      setIsExporting(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: () =>
      importRecipients(
        id,
        importMode === 'file' ? importFile : null,
        importMode === 'paste' ? pastedEmails : undefined,
        importMode === 'file' ? columnMapping : undefined
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaign-recipients', id] });
      const d = res.data;
      toast.success(
        `Imported ${d.inserted} recipients${d.suppressed > 0 ? `, ${d.suppressed} suppressed` : ''}${
          d.invalid > 0 ? `, ${d.invalid} invalid` : ''
        }`
      );
      setPastedEmails('');
      setImportFile(null);
      setCsvHeaders([]);
      setCsvRows([]);
    },
    onError: (e: any) => toast.error(e?.message ?? 'Import failed'),
  });

  if (isLoading) return (
    <div style={{ padding: '32px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      Loading campaign...
    </div>
  );

  if (!campaign) return (
    <div style={{ padding: '32px', textAlign: 'center' }}>
      <AlertCircle size={32} color="var(--color-error)" style={{ margin: '0 auto 12px', display: 'block' }} />
      <p>Campaign not found</p>
      <Link href="/app/campaigns" style={{ color: 'var(--color-accent)', fontSize: '13px' }}>← Back to campaigns</Link>
    </div>
  );

  const isEditable = ['DRAFT', 'READY'].includes(campaign.status);
  const pct = campaign.totalRecipients > 0
    ? Math.round((campaign.sentCount + campaign.failedCount + campaign.cancelledCount) / campaign.totalRecipients * 100)
    : 0;

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>
      {/* Back + Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/app/campaigns" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '13px', textDecoration: 'none', marginBottom: '12px' }}>
          <ArrowLeft size={14} /> Campaigns
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '6px' }}>{campaign.name}</h1>
            <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, background: `${STATUS_COLOR[campaign.status]}22`, color: STATUS_COLOR[campaign.status] }}>
              {campaign.status}
            </span>
          </div>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {isEditable && (
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '13px', cursor: 'pointer' }}>
                <Save size={13} /> {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            )}
            {['DRAFT', 'READY'].includes(campaign.status) && (
              <button onClick={() => actionMutation.mutate('launch')} disabled={actionMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--color-accent)', border: 'none', borderRadius: '6px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                <Send size={13} /> Launch
              </button>
            )}
            {campaign.status === 'RUNNING' && (
              <button onClick={() => actionMutation.mutate('pause')} disabled={actionMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--color-warning-dim)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', color: 'var(--color-warning)', fontSize: '13px', cursor: 'pointer' }}>
                <Pause size={13} /> Pause
              </button>
            )}
            {campaign.status === 'PAUSED' && (
              <button onClick={() => actionMutation.mutate('resume')} disabled={actionMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--color-accent)', border: 'none', borderRadius: '6px', color: 'white', fontSize: '13px', cursor: 'pointer' }}>
                <Play size={13} /> Resume
              </button>
            )}
            {['RUNNING', 'PAUSED', 'SCHEDULED'].includes(campaign.status) && (
              <button onClick={() => { if (confirm('Cancel this campaign? This cannot be undone.')) actionMutation.mutate('cancel'); }} disabled={actionMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--color-error-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: 'var(--color-error)', fontSize: '13px', cursor: 'pointer' }}>
                <X size={13} /> Cancel
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {campaign.totalRecipients > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
              <span>{(campaign.sentCount + campaign.failedCount).toLocaleString()} / {campaign.totalRecipients.toLocaleString()} processed ({pct}%)</span>
              <span style={{ color: 'var(--color-success)' }}>{campaign.sentCount.toLocaleString()} sent</span>
            </div>
            <div style={{ height: '6px', background: 'var(--color-surface-3)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-accent)', borderRadius: '3px', transition: 'width 0.5s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--color-border-subtle)', marginBottom: '24px' }}>
        {(['content', 'recipients', 'progress'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === tab ? '2px solid var(--color-accent)' : '2px solid transparent',
            color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === tab ? 600 : 400, fontSize: '13px', marginBottom: '-1px',
            textTransform: 'capitalize',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Content */}
      {activeTab === 'content' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</label>
            <input disabled={!isEditable} value={localForm.name} onChange={(e) => setLocalForm(f => ({ ...f, name: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '14px', opacity: isEditable ? 1 : 0.7 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sender</label>
            <select disabled={!isEditable} value={localForm.senderId} onChange={(e) => setLocalForm(f => ({ ...f, senderId: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '14px', opacity: isEditable ? 1 : 0.7 }}>
              <option value="">Select a sender...</option>
              {senders.map((s) => <option key={s.id} value={s.id}>{s.name} &lt;{s.email}&gt;</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Subject</label>
            <input disabled={!isEditable} value={localForm.subject} onChange={(e) => setLocalForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. Hello {{firstName}}, here's your update" style={{ width: '100%', padding: '9px 12px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '14px', opacity: isEditable ? 1 : 0.7 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              HTML Body — supports {'{{firstName}}, {{lastName}}, {{email}}, {{company}}'}
            </label>
            <textarea disabled={!isEditable} value={localForm.htmlBody} onChange={(e) => setLocalForm(f => ({ ...f, htmlBody: e.target.value }))}
              rows={14} placeholder="<p>Hello {{firstName}},</p><p>Your message here...</p>"
              style={{ width: '100%', padding: '9px 12px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '13px', fontFamily: 'var(--font-mono)', resize: 'vertical', opacity: isEditable ? 1 : 0.7 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Delivery Mode</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select disabled={!isEditable} value={localForm.deliveryMode} onChange={(e) => setLocalForm(f => ({ ...f, deliveryMode: e.target.value }))}
                style={{ flex: 1, padding: '9px 12px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '14px', opacity: isEditable ? 1 : 0.7 }}>
                <option value="IMMEDIATE">Immediate (burst)</option>
                <option value="FIXED_GAP">Fixed Gap (throttled)</option>
              </select>
              {localForm.deliveryMode === 'FIXED_GAP' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" min={100} step={100} disabled={!isEditable} value={localForm.delayMs}
                    onChange={(e) => setLocalForm(f => ({ ...f, delayMs: Number(e.target.value) }))}
                    style={{ width: '100px', padding: '9px 12px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '14px' }} />
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>ms gap</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Recipients */}
      {activeTab === 'recipients' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Recipients</h3>
              <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                {campaign.totalRecipients.toLocaleString()} total
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 12px', background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border)', borderRadius: '6px',
                  fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                title="Download standard CSV structure"
              >
                <Download size={13} /> Sample CSV Template
              </button>

              <button
                type="button"
                onClick={handleExportRecipients}
                disabled={isExporting || campaign.totalRecipients === 0}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 12px', background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border)', borderRadius: '6px',
                  fontSize: '12px', fontWeight: 500,
                  color: campaign.totalRecipients === 0 ? 'var(--color-text-disabled)' : 'var(--color-text-primary)',
                  cursor: campaign.totalRecipients === 0 ? 'not-allowed' : 'pointer',
                  opacity: isExporting ? 0.7 : 1,
                }}
              >
                {isExporting ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Download size={13} />}
                Export Recipients (CSV)
              </button>
            </div>
          </div>

          {/* Import Section (Editable Only) */}
          {isEditable ? (
            <div style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
                  Import Recipients
                </div>
                <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface-2)', padding: '3px', borderRadius: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setImportMode('file')}
                    style={{
                      padding: '5px 12px', borderRadius: '4px', border: 'none',
                      background: importMode === 'file' ? 'var(--color-accent)' : 'transparent',
                      color: importMode === 'file' ? 'white' : 'var(--color-text-muted)',
                      fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    Upload CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('paste')}
                    style={{
                      padding: '5px 12px', borderRadius: '4px', border: 'none',
                      background: importMode === 'paste' ? 'var(--color-accent)' : 'transparent',
                      color: importMode === 'paste' ? 'white' : 'var(--color-text-muted)',
                      fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    Paste Text
                  </button>
                </div>
              </div>

              {importMode === 'file' ? (
                <div>
                  {/* Drag & Drop Zone */}
                  {!importFile ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                      onDragLeave={() => setIsDraggingOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileChange(file);
                      }}
                      style={{
                        border: `2px dashed ${isDraggingOver ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        borderRadius: '8px', padding: '36px 20px', textAlign: 'center',
                        background: isDraggingOver ? 'rgba(99, 102, 241, 0.08)' : 'var(--color-surface-2)',
                        transition: 'all 0.2s', cursor: 'pointer',
                      }}
                      onClick={() => document.getElementById('campaign-csv-input')?.click()}
                    >
                      <Upload size={28} color={isDraggingOver ? 'var(--color-accent)' : 'var(--color-text-muted)'} style={{ margin: '0 auto 10px', display: 'block' }} />
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                        Click to choose or drag & drop recipient CSV
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Supports CSV or TXT with email, firstName, lastName, company
                      </p>
                      <input
                        type="file"
                        accept=".csv,.txt"
                        id="campaign-csv-input"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          handleFileChange(file);
                        }}
                        style={{ display: 'none' }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Selected File Banner */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 16px', background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)', borderRadius: '8px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileText size={18} color="var(--color-accent)" />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {importFile.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                              {(importFile.size / 1024).toFixed(1)} KB · {csvRows.length} rows detected · {csvHeaders.length} columns
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setImportFile(null);
                            setCsvHeaders([]);
                            setCsvRows([]);
                          }}
                          style={{
                            background: 'none', border: 'none', color: 'var(--color-text-muted)',
                            cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px',
                          }}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>

                      {/* Column Mapping Section */}
                      {csvHeaders.length > 0 && (
                        <div style={{
                          padding: '16px', background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border-subtle)', borderRadius: '8px',
                        }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Check size={14} color="var(--color-accent)" /> Column Mapping (Detected from Header)
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Email *
                              </label>
                              <select
                                value={columnMapping.email}
                                onChange={(e) => setColumnMapping(m => ({ ...m, email: e.target.value }))}
                                style={{ width: '100%', padding: '7px 10px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '12px' }}
                              >
                                <option value="">Select column...</option>
                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                                First Name
                              </label>
                              <select
                                value={columnMapping.firstName}
                                onChange={(e) => setColumnMapping(m => ({ ...m, firstName: e.target.value }))}
                                style={{ width: '100%', padding: '7px 10px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '12px' }}
                              >
                                <option value="">(None)</option>
                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Last Name
                              </label>
                              <select
                                value={columnMapping.lastName}
                                onChange={(e) => setColumnMapping(m => ({ ...m, lastName: e.target.value }))}
                                style={{ width: '100%', padding: '7px 10px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '12px' }}
                              >
                                <option value="">(None)</option>
                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Company
                              </label>
                              <select
                                value={columnMapping.company}
                                onChange={(e) => setColumnMapping(m => ({ ...m, company: e.target.value }))}
                                style={{ width: '100%', padding: '7px 10px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '12px' }}
                              >
                                <option value="">(None)</option>
                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Pre-Upload Validation Preview Table */}
                      {csvRows.length > 0 && (
                        <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
                          <div style={{ padding: '8px 14px', background: 'var(--color-surface-2)', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--color-border-subtle)' }}>
                            Preview First {Math.min(5, csvRows.length)} Rows
                          </div>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-surface-1)' }}>
                                <th style={{ padding: '7px 12px', textAlign: 'left', color: 'var(--color-text-muted)' }}>Email (Mapped)</th>
                                <th style={{ padding: '7px 12px', textAlign: 'left', color: 'var(--color-text-muted)' }}>First Name</th>
                                <th style={{ padding: '7px 12px', textAlign: 'left', color: 'var(--color-text-muted)' }}>Last Name</th>
                                <th style={{ padding: '7px 12px', textAlign: 'left', color: 'var(--color-text-muted)' }}>Company</th>
                                <th style={{ padding: '7px 12px', textAlign: 'left', color: 'var(--color-text-muted)' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {csvRows.slice(0, 5).map((r, i) => {
                                const emailVal = columnMapping.email ? (r[columnMapping.email] || '') : (r['email'] || '');
                                const isValid = emailVal.includes('@') && emailVal.includes('.');
                                return (
                                  <tr key={i} style={{ borderBottom: i < 4 ? '1px solid var(--color-border-subtle)' : 'none' }}>
                                    <td style={{ padding: '7px 12px', fontFamily: 'var(--font-mono)' }}>{emailVal || '—'}</td>
                                    <td style={{ padding: '7px 12px', color: 'var(--color-text-secondary)' }}>
                                      {columnMapping.firstName ? (r[columnMapping.firstName] || '—') : '—'}
                                    </td>
                                    <td style={{ padding: '7px 12px', color: 'var(--color-text-secondary)' }}>
                                      {columnMapping.lastName ? (r[columnMapping.lastName] || '—') : '—'}
                                    </td>
                                    <td style={{ padding: '7px 12px', color: 'var(--color-text-muted)' }}>
                                      {columnMapping.company ? (r[columnMapping.company] || '—') : '—'}
                                    </td>
                                    <td style={{ padding: '7px 12px' }}>
                                      <span style={{
                                        padding: '1px 6px', borderRadius: '100px', fontSize: '10px', fontWeight: 600,
                                        background: isValid ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                        color: isValid ? 'var(--color-success)' : 'var(--color-error)',
                                      }}>
                                        {isValid ? 'Valid' : 'Invalid'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Submit Import */}
                      <button
                        type="button"
                        onClick={() => importMutation.mutate()}
                        disabled={importMutation.isPending || !columnMapping.email}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '8px',
                          padding: '9px 18px', background: 'var(--color-accent)',
                          border: 'none', borderRadius: '6px', color: 'white',
                          fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                          opacity: importMutation.isPending || !columnMapping.email ? 0.6 : 1,
                          alignSelf: 'flex-start',
                        }}
                      >
                        {importMutation.isPending ? (
                          <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                        ) : (
                          <Upload size={14} />
                        )}
                        {importMutation.isPending ? 'Importing CSV...' : `Import ${csvRows.length} Recipients`}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <textarea
                    value={pastedEmails}
                    onChange={(e) => setPastedEmails(e.target.value)}
                    rows={6}
                    placeholder="alice@example.com&#10;bob@example.com&#10;carol@example.com"
                    style={{
                      width: '100%', padding: '10px 12px', background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)', borderRadius: '6px',
                      color: 'var(--color-text-primary)', fontSize: '13px',
                      fontFamily: 'var(--font-mono)', resize: 'vertical', marginBottom: '12px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => importMutation.mutate()}
                    disabled={importMutation.isPending || !pastedEmails.trim()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '9px 18px', background: 'var(--color-accent)',
                      border: 'none', borderRadius: '6px', color: 'white',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      opacity: importMutation.isPending || !pastedEmails.trim() ? 0.6 : 1,
                    }}
                  >
                    {importMutation.isPending ? (
                      <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      <Upload size={14} />
                    )}
                    {importMutation.isPending ? 'Importing...' : 'Import Pasted Emails'}
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Search & Filter Bar for Existing Recipients */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                placeholder="Search recipients..."
                style={{
                  width: '100%', padding: '7px 10px 7px 30px',
                  background: 'var(--color-surface-1)', border: '1px solid var(--color-border)',
                  borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '12px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['ALL', 'PENDING', 'SCHEDULED', 'SENT', 'FAILED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setRecipientStatusFilter(st)}
                  style={{
                    padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
                    border: `1px solid ${recipientStatusFilter === st ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: recipientStatusFilter === st ? 'var(--color-accent-dim)' : 'transparent',
                    color: recipientStatusFilter === st ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Recipients List Table */}
          {recipientsData?.data && (recipientsData.data as any[]).length > 0 ? (
            <div style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-surface-2)' }}>
                    {['Email', 'Name', 'Company', 'Status', 'Scheduled / Processed'].map((c) => (
                      <th key={c} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(recipientsData.data as any[])
                    .filter((r: any) => {
                      if (recipientStatusFilter !== 'ALL' && r.status !== recipientStatusFilter) return false;
                      if (!recipientSearch) return true;
                      const q = recipientSearch.toLowerCase();
                      return (
                        r.email.toLowerCase().includes(q) ||
                        (r.firstName && r.firstName.toLowerCase().includes(q)) ||
                        (r.lastName && r.lastName.toLowerCase().includes(q)) ||
                        (r.company && r.company.toLowerCase().includes(q))
                      );
                    })
                    .slice(0, 100)
                    .map((r: any, i: number) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '9px 14px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{r.email}</td>
                        <td style={{ padding: '9px 14px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          {[r.firstName, r.lastName].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td style={{ padding: '9px 14px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                          {r.company || '—'}
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          <span style={{
                            padding: '2px 7px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
                            background: `${STATUS_COLOR[r.status] ?? 'var(--color-text-muted)'}22`,
                            color: STATUS_COLOR[r.status] ?? 'var(--color-text-muted)',
                          }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: '9px 14px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {r.processedAt ? new Date(r.processedAt).toLocaleTimeString() : (r.scheduledAt ? new Date(r.scheduledAt).toLocaleTimeString() : '—')}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '48px 20px', textAlign: 'center', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>No recipients found for this campaign.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Progress */}
      {activeTab === 'progress' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Sent', value: (progress ?? campaign).sentCount, color: 'var(--color-success)' },
              { label: 'Failed', value: (progress ?? campaign).failedCount, color: 'var(--color-error)' },
              { label: 'Pending', value: (progress ?? campaign).pendingCount, color: 'var(--color-text-muted)' },
              { label: 'Deferred', value: (progress ?? campaign).deferredCount, color: 'var(--color-warning)' },
              { label: 'Cancelled', value: (progress ?? campaign).cancelledCount, color: 'var(--color-text-disabled)' },
              { label: 'Total', value: campaign.totalRecipients, color: 'var(--color-text-primary)' },
            ].map((s) => (
              <div key={s.label} style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>{s.label}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{(s.value ?? 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
          {['RUNNING', 'PAUSED'].includes(campaign.status) && (
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Live — updating every 2 seconds
              <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
