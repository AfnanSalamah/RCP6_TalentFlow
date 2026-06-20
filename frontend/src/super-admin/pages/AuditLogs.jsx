import { useState, useEffect, useRef } from 'react';
import SALayout from '../components/Layout';
import { saApi } from '../api/index';
import { Search, Shield, X, ChevronLeft, ChevronRight } from 'lucide-react';

const MODULE_COLORS = {
  companies: '#0A4174',
  subscriptions: '#7C3AED',
  users: '#059669',
  tickets: '#D97706',
  announcements: '#DC2626',
  auth: '#001D39',
};

export default function AuditLogs() {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [module, setModule]   = useState('');
  const [page, setPage]       = useState(0);
  const LIMIT = 50;
  const debounce = useRef(null);

  const load = (p = page, s = search, m = module) => {
    setLoading(true);
    saApi.getAuditLogs({ skip: p * LIMIT, limit: LIMIT, search: s || undefined, module: m || undefined })
      .then(d => { setLogs(d.items || d); setTotal(d.total || (d.items || d).length); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(0, search, module); setPage(0); }, [module]);

  function handleSearch(v) {
    setSearch(v);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { setPage(0); load(0, v, module); }, 350);
  }

  const modules = ['companies', 'subscriptions', 'users', 'tickets', 'announcements', 'auth'];
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <SALayout title="Audit Logs">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '10px 16px', flex: 1, maxWidth: 360 }}>
            <Search size={16} color="#94A3B8" />
            <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search by user, action, IP…"
              style={{ border: 'none', outline: 'none', fontSize: 14, flex: 1, background: 'transparent', color: '#0F172A' }} />
            {search && <button onClick={() => handleSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={14} /></button>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setModule('')} style={{ padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: module === '' ? '#001D39' : '#F8FAFC', color: module === '' ? '#fff' : '#475569' }}>All</button>
            {modules.map(m => (
              <button key={m} onClick={() => setModule(m)} style={{ padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: module === m ? MODULE_COLORS[m] : '#F8FAFC', color: module === m ? '#fff' : '#475569', textTransform: 'capitalize' }}>{m}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Time', 'User', 'Module', 'Action', 'Detail', 'Company', 'IP'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading…</td></tr>
              : logs.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 60, textAlign: 'center', color: '#94A3B8' }}>
                  <Shield size={32} style={{ opacity: 0.3, marginBottom: 10 }} /><br />No audit logs found
                </td></tr>
              ) : logs.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid #F8FAFC' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFBFF'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <td style={{ padding: '11px 14px', fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>{new Date(l.created_at).toLocaleString()}</td>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#0F172A', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.user || 'System'}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: '#EFF6FF', color: MODULE_COLORS[l.module] || '#475569', textTransform: 'capitalize' }}>{l.module}</span>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: l.action?.includes('delete') || l.action?.includes('suspend') ? '#DC2626' : '#0A4174' }}>{l.action}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#475569', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.detail}>{l.detail || '—'}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#94A3B8' }}>{l.company_name || l.company_id || '—'}</td>
                  <td style={{ padding: '11px 14px', fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>{l.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94A3B8' }}>Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => { const p = page - 1; setPage(p); load(p); }} disabled={page === 0}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: page === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', opacity: page === 0 ? 0.4 : 1 }}>
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => { const p = page + 1; setPage(p); load(p); }} disabled={page >= totalPages - 1}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SALayout>
  );
}
