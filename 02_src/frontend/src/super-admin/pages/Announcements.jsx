import { useState, useEffect } from 'react';
import SALayout from '../components/Layout';
import { saApi } from '../api/index';
import { formatLocalDateTime } from '../../utils/dateTime';
import { Plus, Megaphone, Trash2, X, Globe, Building2 } from 'lucide-react';

const TYPE_COLORS = { info: '#0A4174:#EFF6FF', warning: '#92400E:#FEF3C7', success: '#065F46:#D1FAE5', critical: '#DC2626:#FEF2F2' };
const TARGET_LABELS = {
  all: 'All Users',
  candidates: 'All Candidates',
  employees: 'All Employees',
  recruiters: 'All Recruiters',
  companies: 'All Companies',
  company: 'Specific Company',
};
function tc(t) { const [c, bg] = (TYPE_COLORS[t] || '#475569:#F1F5F9').split(':'); return { color: c, background: bg }; }

export default function Announcements() {
  const [list, setList]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ title: '', message: '', type: 'info', target: 'all', company_id: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    saApi.listAnnouncements().then(setList).finally(() => setLoading(false));
  };
  useEffect(() => { load(); saApi.listCompanies().then(setCompanies); }, []);

  async function handleCreate() {
    if (!form.title.trim() || !form.message.trim()) return;
    if (form.target === 'company' && !form.company_id) return;
    setSaving(true);
    const payload = { ...form };
    if (payload.target === 'all') delete payload.company_id;
    else payload.company_id = parseInt(payload.company_id);
    await saApi.createAnnouncement(payload);
    setSaving(false);
    setShowCreate(false);
    setForm({ title: '', message: '', type: 'info', target: 'all', company_id: '' });
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this announcement?')) return;
    await saApi.deleteAnnouncement(id);
    load();
  }

  return (
    <SALayout title="Announcements">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: 14 }}>Broadcast announcements to users, candidates, employees, recruiters, companies, or one company</p>
          <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg,#001D39,#0A4174)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,29,57,0.2)' }}>
            <Plus size={16} /> New Announcement
          </button>
        </div>

        {/* List */}
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Loading…</div>
        : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 16, border: '1px solid #F1F5F9', color: '#94A3B8' }}>
            <Megaphone size={40} style={{ opacity: 0.3, marginBottom: 12 }} /><br />
            <strong>No announcements yet</strong><br />
            <span style={{ fontSize: 13 }}>Create your first announcement to notify users</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {list.map(a => (
              <div key={a.id} style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...tc(a.type) }}>
                  <Megaphone size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#0F172A' }}>{a.title}</h3>
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', ...tc(a.type) }}>{a.type}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: a.target === 'all' ? '#F0FDF4' : '#EFF6FF', color: a.target === 'all' ? '#059669' : '#0A4174' }}>
                      {a.target === 'company' || a.company_id ? <><Building2 size={10} /> {a.company_name || `Company #${a.company_id}`}</> : <><Globe size={10} /> {TARGET_LABELS[a.target] || 'All Users'}</>}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: '#374151', margin: '0 0 8px', lineHeight: 1.6 }}>{a.message}</p>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{formatLocalDateTime(a.created_at)}</span>
                </div>
                <button onClick={() => handleDelete(a.id)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowCreate(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 36, maxWidth: 520, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>New Announcement</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Scheduled maintenance on June 15"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0F172A' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff', color: '#0F172A' }}>
                    {['info','warning','success','critical'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Target</label>
                  <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value, company_id: '' }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff', color: '#0F172A' }}>
                    <option value="all">All Users</option>
                    <option value="candidates">All Candidates</option>
                    <option value="employees">All Employees</option>
                    <option value="recruiters">All Recruiters</option>
                    <option value="companies">All Companies</option>
                    <option value="company">Specific Company</option>
                  </select>
                </div>
              </div>
              {form.target === 'company' && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Company</label>
                  <select value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff', color: '#0F172A' }}>
                    <option value="">Select company…</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Message</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4} placeholder="Write the full announcement message here…"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', color: '#0F172A' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '12px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#475569' }}>Cancel</button>
                <button onClick={handleCreate} disabled={saving || !form.title || !form.message || (form.target === 'company' && !form.company_id)} style={{ flex: 2, padding: '12px', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg,#001D39,#0A4174)', color: '#fff', opacity: (!form.title || !form.message || (form.target === 'company' && !form.company_id)) ? 0.6 : 1 }}>
                  {saving ? 'Publishing…' : 'Publish Announcement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SALayout>
  );
}
