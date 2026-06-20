import { useState, useEffect } from 'react';
import SALayout from '../components/Layout';
import { saApi } from '../api/index';
import { Ticket, Plus, X, Send, ChevronDown } from 'lucide-react';

const STATUS_COLORS = { 'Open': '#EFF6FF:#0A4174', 'In Progress': '#FFFBEB:#92400E', 'Resolved': '#D1FAE5:#065F46', 'Closed': '#F1F5F9:#475569' };
const PRIORITY_COLORS = { Low: '#94A3B8', Medium: '#D97706', High: '#DC2626', Critical: '#7C3AED' };

function sc(key) { const p = STATUS_COLORS[key] || '#F1F5F9:#475569'; const [bg, co] = p.split(':'); return { background: bg, color: co }; }

export default function Tickets() {
  const [tickets, setTickets]     = useState([]);
  const [selected, setSelected]   = useState(null);
  const [detail, setDetail]       = useState(null);
  const [reply, setReply]         = useState('');
  const [filter, setFilter]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [newTicket, setNewTicket] = useState({ company_id: '', subject: '', message: '', priority: 'Medium' });

  const load = () => {
    setLoading(true);
    saApi.listTickets(filter ? { status_filter: filter } : {}).then(setTickets).finally(() => setLoading(false));
  };
  useEffect(() => { load(); saApi.listCompanies().then(setCompanies); }, [filter]);

  useEffect(() => {
    if (selected) saApi.getTicket(selected).then(setDetail);
    else setDetail(null);
  }, [selected]);

  async function handleReply() {
    if (!reply.trim()) return;
    setSending(true);
    await saApi.replyTicket(selected, reply);
    setReply('');
    const updated = await saApi.getTicket(selected);
    setDetail(updated);
    load();
    setSending(false);
  }

  async function handleStatus(status) {
    await saApi.updateTicketStatus(selected, status);
    const updated = await saApi.getTicket(selected);
    setDetail(updated);
    load();
  }

  async function handleCreate() {
    if (!newTicket.company_id || !newTicket.subject || !newTicket.message) return;
    await saApi.createTicket({ ...newTicket, company_id: parseInt(newTicket.company_id) });
    setShowCreate(false);
    setNewTicket({ company_id: '', subject: '', message: '', priority: 'Medium' });
    load();
  }

  return (
    <SALayout title="Support Tickets">
      <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 140px)' }}>
        {/* List panel */}
        <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              style={{ flex: 1, padding: '9px 14px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff', color: '#0F172A' }}>
              <option value="">All Tickets</option>
              {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => setShowCreate(true)} style={{ padding: '9px 14px', background: 'linear-gradient(135deg,#001D39,#0A4174)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
              <Plus size={14} /> New
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8' }}>Loading…</div>
            : tickets.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                <Ticket size={32} style={{ marginBottom: 8, opacity: 0.4 }} /><br />No tickets found
              </div>
            ) : tickets.map(t => (
              <div key={t.id} onClick={() => setSelected(t.id)}
                style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', border: `1.5px solid ${selected === t.id ? '#0A4174' : '#F1F5F9'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.04)', transition: 'all 0.12s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', flex: 1, paddingRight: 8 }}>{t.subject}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, ...sc(t.status), flexShrink: 0 }}>{t.status}</span>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{t.company_name} · #{t.id}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLORS[t.priority] || '#94A3B8' }}>{t.priority}</span>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{t.reply_count} replies</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 16, border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!detail ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', flexDirection: 'column', gap: 12 }}>
              <Ticket size={40} style={{ opacity: 0.3 }} />
              <span>Select a ticket to view details</span>
            </div>
          ) : (
            <>
              {/* Ticket header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: '#0F172A' }}>{detail.subject}</h3>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>#{detail.id} · {detail.company_name} · Priority: <strong style={{ color: PRIORITY_COLORS[detail.priority] }}>{detail.priority}</strong></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={detail.status} onChange={e => handleStatus(e.target.value)}
                    style={{ padding: '7px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 600, outline: 'none', background: '#fff', cursor: 'pointer', color: '#0F172A' }}>
                    {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Original message */}
                <div style={{ padding: '14px 18px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0A4174', marginBottom: 6 }}>{detail.company_name} (Original)</div>
                  <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{detail.message}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>{new Date(detail.created_at).toLocaleString()}</div>
                </div>
                {/* Replies */}
                {detail.replies?.map(r => (
                  <div key={r.id} style={{ padding: '14px 18px', background: r.author === 'Super Admin' ? '#EFF6FF' : '#F8FAFC', borderRadius: 12, border: `1px solid ${r.author === 'Super Admin' ? '#BFDBFE' : '#F1F5F9'}`, alignSelf: r.author === 'Super Admin' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: r.author === 'Super Admin' ? '#0A4174' : '#374151', marginBottom: 4 }}>{r.author}</div>
                    <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{r.message}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              {detail.status !== 'Closed' && (
                <div style={{ padding: '16px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10 }}>
                  <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Write a reply…" rows={2}
                    style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'none', color: '#0F172A', background: '#F8FAFC' }} />
                  <button onClick={handleReply} disabled={sending || !reply.trim()}
                    style={{ padding: '10px 18px', background: reply.trim() ? 'linear-gradient(135deg,#001D39,#0A4174)' : '#E2E8F0', color: reply.trim() ? '#fff' : '#94A3B8', border: 'none', borderRadius: 10, cursor: reply.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13 }}>
                    <Send size={14} /> {sending ? 'Sending…' : 'Reply'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowCreate(false)}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 32, maxWidth: 480, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Create Support Ticket</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Company</label>
                <select value={newTicket.company_id} onChange={e => setNewTicket(f => ({ ...f, company_id: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff', color: '#0F172A' }}>
                  <option value="">Select company…</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Subject</label>
                <input value={newTicket.subject} onChange={e => setNewTicket(f => ({ ...f, subject: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0F172A' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Priority</label>
                <select value={newTicket.priority} onChange={e => setNewTicket(f => ({ ...f, priority: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff', color: '#0F172A' }}>
                  {['Low','Medium','High','Critical'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Message</label>
                <textarea value={newTicket.message} onChange={e => setNewTicket(f => ({ ...f, message: e.target.value }))} rows={4}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', color: '#0F172A' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '11px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#475569' }}>Cancel</button>
                <button onClick={handleCreate} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg,#001D39,#0A4174)', color: '#fff' }}>Create Ticket</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SALayout>
  );
}
