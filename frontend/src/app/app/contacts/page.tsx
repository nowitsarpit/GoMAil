'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContacts, exportContactsCsv, importContacts } from '@/lib/api';
import { Users, Search, Loader2, Download, Upload, FileText, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseCsvSimple } from '@/lib/csv';

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
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

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', { search, page }],
    queryFn: () => getContacts({ search, page: String(page) }),
  });

  const contacts = (data?.data as any[]) ?? [];
  const pagination = data?.pagination;

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

      const lowerHeaders = headers.map(h => h.toLowerCase());
      const findBest = (patterns: string[]) => {
        for (const p of patterns) {
          const idx = lowerHeaders.findIndex(h => h.includes(p));
          if (idx !== -1) return headers[idx];
        }
        return '';
      };

      setColumnMapping({
        email: findBest(['email', 'mail', 'e-mail']) || (headers[0] ?? ''),
        firstName: findBest(['first_name', 'firstname', 'first', 'fname']),
        lastName: findBest(['last_name', 'lastname', 'last', 'lname']),
        company: findBest(['company', 'org', 'organization', 'business']),
      });
    } catch {
      toast.error('Failed to parse CSV preview');
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = 'email,firstName,lastName,company\nalice@example.com,Alice,Smith,Acme Corp\nbob@techflow.io,Bob,Jones,TechFlow Inc\ncharlie@venture.co,Charlie,Brown,Venture Labs';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_sample_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded');
  };

  const handleExportContacts = async () => {
    setIsExporting(true);
    try {
      const blob = await exportContactsCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Contacts exported to CSV');
    } catch {
      toast.error('Failed to export contacts');
    } finally {
      setIsExporting(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: () => importContacts(importFile, undefined, columnMapping),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success(`Imported ${res.data.inserted} contacts (${res.data.invalid} invalid skipped)`);
      setImportModalOpen(false);
      setImportFile(null);
      setCsvHeaders([]);
      setCsvRows([]);
    },
    onError: (err: any) => toast.error(err.message || 'Import failed'),
  });

  return (
    <div style={{ padding: '32px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>Contacts</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {pagination?.total ?? 0} contacts in this organization
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleDownloadSampleCsv}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)', borderRadius: '6px',
              fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            <Download size={14} /> Sample CSV
          </button>

          <button
            onClick={handleExportContacts}
            disabled={isExporting || (pagination?.total ?? 0) === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)', borderRadius: '6px',
              fontSize: '13px', fontWeight: 500,
              color: (pagination?.total ?? 0) === 0 ? 'var(--color-text-disabled)' : 'var(--color-text-primary)',
              cursor: (pagination?.total ?? 0) === 0 ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.7 : 1,
            }}
          >
            {isExporting ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Download size={14} />}
            Export Contacts (CSV)
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', background: 'var(--color-accent)',
              border: 'none', borderRadius: '6px', color: 'white',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Upload size={14} /> Import CSV
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search contacts by email, name, company..."
          style={{ width: '100%', maxWidth: '360px', padding: '8px 12px 8px 32px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '13px' }}
        />
      </div>

      {/* Contacts Table */}
      <div style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Loading contacts...
          </div>
        ) : contacts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Users size={32} color="var(--color-text-disabled)" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontWeight: 500, marginBottom: '6px' }}>No contacts yet</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Import contacts via CSV or add recipients to your campaigns.
            </p>
            <button
              onClick={() => setImportModalOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', background: 'var(--color-accent)',
                border: 'none', borderRadius: '6px', color: 'white',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Upload size={14} /> Import Contacts CSV
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-surface-2)' }}>
                {['Email', 'Name', 'Company', 'Tags', 'Added'].map(c => (
                  <th key={c} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contacts.map((c: any, i: number) => (
                <tr key={c.id} style={{ borderBottom: i < contacts.length - 1 ? '1px solid var(--color-border-subtle)' : 'none' }}>
                  <td style={{ padding: '10px 16px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{c.email}</td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}</td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>{c.company ?? '—'}</td>
                  <td style={{ padding: '10px 16px' }}>
                    {c.tags?.length > 0 ? c.tags.map((t: string) => (
                      <span key={t} style={{ padding: '2px 7px', borderRadius: '100px', fontSize: '11px', background: 'var(--color-surface-3)', color: 'var(--color-text-secondary)', marginRight: '4px' }}>{t}</span>
                    )) : <span style={{ fontSize: '12px', color: 'var(--color-text-disabled)' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--color-text-muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '6px 12px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '13px', cursor: 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
            Previous
          </button>
          <span style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {page} / {pagination.totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
            style={{ padding: '6px 12px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '13px', cursor: 'pointer', opacity: page === pagination.totalPages ? 0.5 : 1 }}>
            Next
          </button>
        </div>
      )}

      {/* Import Contacts Modal */}
      {importModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px',
        }}>
          <div style={{
            background: 'var(--color-surface-1)', border: '1px solid var(--color-border)',
            borderRadius: '12px', width: '100%', maxWidth: '600px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>Import Contacts via CSV</div>
              <button
                onClick={() => { setImportModalOpen(false); setImportFile(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    cursor: 'pointer',
                  }}
                  onClick={() => document.getElementById('contacts-csv-input')?.click()}
                >
                  <Upload size={28} color="var(--color-accent)" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    Click or drag & drop contacts CSV here
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Standard CSV with email, firstName, lastName, company
                  </p>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    id="contacts-csv-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      handleFileChange(file);
                    }}
                    style={{ display: 'none' }}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)', borderRadius: '6px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="var(--color-accent)" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{importFile.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {(importFile.size / 1024).toFixed(1)} KB · {csvRows.length} rows detected
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setImportFile(null); setCsvHeaders([]); setCsvRows([]); }}
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Column Mapping */}
                  {csvHeaders.length > 0 && (
                    <div style={{ padding: '14px', background: 'var(--color-surface-2)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Column Mapping
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Email *</label>
                          <select
                            value={columnMapping.email}
                            onChange={(e) => setColumnMapping(m => ({ ...m, email: e.target.value }))}
                            style={{ width: '100%', padding: '6px 8px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '12px', color: 'var(--color-text-primary)' }}
                          >
                            <option value="">Select column...</option>
                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>First Name</label>
                          <select
                            value={columnMapping.firstName}
                            onChange={(e) => setColumnMapping(m => ({ ...m, firstName: e.target.value }))}
                            style={{ width: '100%', padding: '6px 8px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '12px', color: 'var(--color-text-primary)' }}
                          >
                            <option value="">(None)</option>
                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Last Name</label>
                          <select
                            value={columnMapping.lastName}
                            onChange={(e) => setColumnMapping(m => ({ ...m, lastName: e.target.value }))}
                            style={{ width: '100%', padding: '6px 8px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '12px', color: 'var(--color-text-primary)' }}
                          >
                            <option value="">(None)</option>
                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Company</label>
                          <select
                            value={columnMapping.company}
                            onChange={(e) => setColumnMapping(m => ({ ...m, company: e.target.value }))}
                            style={{ width: '100%', padding: '6px 8px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '12px', color: 'var(--color-text-primary)' }}
                          >
                            <option value="">(None)</option>
                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <button
                      onClick={() => setImportModalOpen(false)}
                      style={{ padding: '8px 14px', background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => importMutation.mutate()}
                      disabled={importMutation.isPending || !columnMapping.email}
                      style={{
                        padding: '8px 16px', background: 'var(--color-accent)',
                        border: 'none', borderRadius: '6px', color: 'white',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        opacity: importMutation.isPending || !columnMapping.email ? 0.6 : 1,
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}
                    >
                      {importMutation.isPending ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Upload size={14} />}
                      Import {csvRows.length} Contacts
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
