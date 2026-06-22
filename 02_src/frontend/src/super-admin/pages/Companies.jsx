import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SALayout from '../components/Layout';
import { saApi } from '../api/index';
import { formatLocalDate } from '../../utils/dateTime';
import { Plus, Search, Building2, Edit2, Trash2, PauseCircle, PlayCircle, ChevronRight, X, Bell, ShieldCheck } from 'lucide-react';

const STATUS_COLORS = {
  active:    { bg: '#D1FAE5', color: '#065F46' },
  expired:   { bg: '#FEF3C7', color: '#92400E' },
  suspended: { bg: '#FEF2F2', color: '#DC2626' },
  cancelled: { bg: '#F1F5F9', color: '#475569' },
};
const PLAN_COLORS = {
  free_trial:   '#94A3B8',
  basic:        '#4E8EA2',
  professional: '#0A4174',
  enterprise:   '#001D39',
};

function Badge({ label, map }) {
  const c = map[label] || { bg: '#F1F5F9', color: '#475569' };
  return <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{label}</span>;
}

export default function Companies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ company_name: '', industry: '', contact_person: '', contact_email: '', contact_phone: '', subscription_plan: 'free_trial', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [alertModal, setAlertModal] = useState(null);
  const [alertForm, setAlertForm] = useState({ title: '', message: '', type: 'warning', send_email: false });
  const [checkResult, setCheckResult] = useState('');

  const load = (s = search) => {
    setLoading(true);
    saApi.listCompanies(s ? { search: s } : {}).then(setCompanies).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!form.company_name.trim()) { setError('Company name is required'); return; }
    setSaving(true);
    try {
      await saApi.createCompany(form);
      setShowModal(false);
      setForm({ company_name: '', industry: '', contact_person: '', contact_email: '', contact_phone: '', subscription_plan: 'free_trial', notes: '' });
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleSuspend(id, active) {
    if (!window.confirm(active ? 'Suspend this company?' : 'Reactivate this company?')) return;
    await (active ? saApi.suspendCompany(id) : saApi.reactivateCompany(id));
    load();
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Permanently delete "${name}" from the database? This cannot be undone.`)) return;
    await saApi.deleteCompany(id, true);
    load();
  }

  async function handleAlertSend() {
    if (!alertForm.title.trim() || !alertForm.message.trim()) return;
    await saApi.alertCompany(alertModal.id, alertForm);
    setAlertModal(null);
    setAlertForm({ title: '', message: '', type: 'warning', send_email: false });
  }

  async function handleRegistrationCheck() {
    const company_name = search.trim();
    if (!company_name) { setCheckResult('Type a company name or email in search first.'); return; }
    try {
      const res = await saApi.checkCompanyRegistration({ company_name, contact_email: company_name.includes('@') ? company_name : '' });
      setCheckResult(res.registered ? `Registered: ${res.company.company_name} (${res.company.subscription_status})` : 'Not registered');
    } catch (e) { setCheckResult(e.message); }
  }

  const filtered = companies.filter(c =>
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SALayout title="Companies">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '10px 16px', flex: 1, maxWidth: 360 }}>
            <Search size={16} color="#94A3B8" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search companies…"
              style={{ border: 'none', outline: 'none', fontSize: 14, flex: 1, background: 'transparent', color: '#0F172A' }}
            />
          </div>
          <button onClick={handleRegistrationCheck} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#ECFDF5', color: '#047857', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}><ShieldCheck size={16} /> Check Registration</button>
          <button onClick={() => { setShowModal(true); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg,#001D39,#0A4174)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,29,57,0.25)' }}>
            <Plus size={16} /> Add Company
          </button>
        </div>

        {checkResult && <div style={{ padding: '10px 14px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', fontSize: 13, fontWeight: 700 }}>{checkResult}</div>}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Total', value: companies.length, color: '#0A4174', bg: '#EFF6FF' },
            { label: 'Active', value: companies.filter(c => c.is_active && c.subscription_status === 'active').length, color: '#059669', bg: '#D1FAE5' },
            { label: 'Expired', value: companies.filter(c => c.subscription_status === 'expired').length, color: '#D97706', bg: '#FEF3C7' },
            { label: 'Suspended', value: companies.filter(c => !c.is_active).length, color: '#DC2626', bg: '#FEF2F2' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #F1F5F9', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                {['Company', 'Industry', 'Plan', 'Status', 'Users', 'Expires', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                  <Building2 size={32} style={{ marginBottom: 8, opacity: 0.4 }} /><br />No companies found
                </td></tr>
              ) : filtered.map(co => (
                <tr key={co.id} style={{ borderBottom: '1px solid #F8FAFC', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFBFF'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#001D39,#0A4174)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff', flexShrink: 0 }}>
                        {co.company_name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{co.company_name}</div>
                        {co.contact_email && <div style={{ fontSize: 12, color: '#94A3B8' }}>{co.contact_email}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#475569' }}>{co.industry || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#EFF6FF', color: PLAN_COLORS[co.subscription_plan] || '#475569' }}>
                      {co.subscription_plan.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}><Badge label={co.subscription_status} map={STATUS_COLORS} /></td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#475569' }}>{co.max_users}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: co.days_left != null && co.days_left <= 30 ? '#D97706' : '#94A3B8' }}>
                    {co.subscription_end_date ? formatLocalDate(co.subscription_end_date) : '—'}
                    {co.days_left != null && co.days_left <= 30 && <span style={{ marginLeft: 4, fontWeight: 700 }}>({co.days_left}d)</span>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button title="View" onClick={() => navigate(`/super-admin/companies/${co.id}`)} style={btnSt('#EFF6FF', '#0A4174')}><ChevronRight size={14} /></button>
                      <button title="Edit" onClick={() => navigate(`/super-admin/companies/${co.id}`)} style={btnSt('#F0FDF4', '#059669')}><Edit2 size={14} /></button>
                      <button title={co.is_active ? 'Suspend' : 'Reactivate'} onClick={() => handleSuspend(co.id, co.is_active)} style={btnSt('#FFFBEB', '#D97706')}>
                        {co.is_active ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                      </button>
                      <button title="Send Alert" onClick={() => { setAlertModal(co); setAlertForm({ title: `Notice for ${co.company_name}`, message: '', type: 'warning', send_email: false }); }} style={btnSt('#F5F3FF', '#7C3AED')}><Bell size={14} /></button>
                      <button title="Delete" onClick={() => handleDelete(co.id, co.company_name)} style={btnSt('#FEF2F2', '#DC2626')}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 36, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#0F172A' }}>Add New Company</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Company Name *', key: 'company_name', placeholder: 'Acme Corp' },
                { label: 'Industry', key: 'industry', placeholder: 'Technology' },
                { label: 'Contact Person', key: 'contact_person', placeholder: 'John Doe' },
                { label: 'Contact Email', key: 'contact_email', placeholder: 'admin@acme.com' },
                { label: 'Contact Phone', key: 'contact_phone', placeholder: '+966 50 000 0000' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0F172A' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Subscription Plan</label>
                <select value={form.subscription_plan} onChange={e => setForm(x => ({ ...x, subscription_plan: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff', color: '#0F172A' }}>
                  <option value="free_trial">Free Trial (14 days)</option>
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              {error && <div style={{ padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, fontSize: 13, color: '#DC2626', fontWeight: 600 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#475569' }}>Cancel</button>
                <button onClick={handleCreate} disabled={saving} style={{ flex: 2, padding: '12px', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#001D39,#0A4174)', color: '#fff' }}>
                  {saving ? 'Creating…' : 'Create Company'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {alertModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setAlertModal(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 30, maxWidth: 500, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: '#0F172A' }}>Send Alert — {alertModal.company_name}</h2>
              <button onClick={() => setAlertModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <input value={alertForm.title} onChange={e => setAlertForm(f => ({ ...f, title: e.target.value }))} placeholder="Alert title" style={{ padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, color: '#0F172A' }} />
              <textarea value={alertForm.message} onChange={e => setAlertForm(f => ({ ...f, message: e.target.value }))} placeholder="Alert message" rows={5} style={{ padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, resize: 'vertical', color: '#0F172A' }} />
              <select value={alertForm.type} onChange={e => setAlertForm(f => ({ ...f, type: e.target.value }))} style={{ padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, background: '#fff', color: '#0F172A' }}>
                <option value="info">Info</option><option value="warning">Warning</option><option value="maintenance">Maintenance</option><option value="feature">Feature</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', fontWeight: 700 }}>
                <input type="checkbox" checked={alertForm.send_email} onChange={e => setAlertForm(f => ({ ...f, send_email: e.target.checked }))} /> Also send by email
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setAlertModal(null)} style={{ flex: 1, padding: '11px', border: '1px solid #E2E8F0', borderRadius: 10, background: '#fff', color: '#475569', fontWeight: 700 }}>Cancel</button>
                <button onClick={handleAlertSend} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,#001D39,#0A4174)', color: '#fff', fontWeight: 800 }}>Send Alert</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </SALayout>
  );
}

const btnSt = (bg, color) => ({
  width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
  background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.12s',
});
