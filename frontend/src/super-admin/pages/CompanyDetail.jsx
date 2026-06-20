import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SALayout from '../components/Layout';
import { saApi } from '../api/index';
import { ArrowLeft, Building2, CreditCard, Users, Save, PauseCircle, PlayCircle } from 'lucide-react';

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [co, setCo] = useState(null);
  const [form, setForm] = useState({});
  const [plans, setPlans] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    saApi.getCompany(id).then(d => { setCo(d); setForm(d); });
    saApi.getPlans().then(setPlans);
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await saApi.updateCompany(id, form);
      setCo(updated);
      setMsg('Saved successfully!');
      setTimeout(() => setMsg(''), 2500);
    } catch (e) { setMsg('Error: ' + e.message); }
    finally { setSaving(false); }
  }

  async function handlePlanChange(plan) {
    if (!window.confirm(`Change plan to "${plan}"?`)) return;
    const updated = await saApi.updateSubscription(id, { plan, extend_days: 365 });
    setCo(updated); setForm(updated);
    setMsg('Plan updated!');
    setTimeout(() => setMsg(''), 2500);
  }

  if (!co) return <SALayout title="Company Detail"><div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading…</div></SALayout>;

  const F = ({ label, field, type = 'text' }) => (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
      <input type={type} value={form[field] || ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0F172A', background: '#F8FAFC' }} />
    </div>
  );

  return (
    <SALayout title={co.company_name}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Back */}
        <button onClick={() => navigate('/super-admin/companies')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#0A4174', fontWeight: 600, alignSelf: 'flex-start', padding: 0 }}>
          <ArrowLeft size={16} /> Back to Companies
        </button>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#001D39,#0A4174)', borderRadius: 16, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff' }}>
              {co.company_name[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>{co.company_name}</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{co.industry || 'No industry specified'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => co.is_active ? saApi.suspendCompany(id).then(() => { setCo(c => ({ ...c, is_active: false, subscription_status: 'suspended' })); }) : saApi.reactivateCompany(id).then(() => { setCo(c => ({ ...c, is_active: true, subscription_status: 'active' })); })}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: co.is_active ? 'rgba(220,38,38,0.2)' : 'rgba(5,150,105,0.2)', color: co.is_active ? '#FCA5A5' : '#6EE7B7' }}>
              {co.is_active ? <><PauseCircle size={14} /> Suspend</> : <><PlayCircle size={14} /> Reactivate</>}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Edit form */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 20px', color: '#0F172A' }}>Company Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <F label="Company Name" field="company_name" />
              <F label="Industry" field="industry" />
              <F label="Contact Person" field="contact_person" />
              <F label="Contact Email" field="contact_email" />
              <F label="Contact Phone" field="contact_phone" />
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Status</label>
                <select value={form.subscription_status || 'active'} onChange={e => setForm(f => ({ ...f, subscription_status: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', background: '#F8FAFC', color: '#0F172A' }}>
                  {['active', 'expired', 'suspended', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Notes</label>
                <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', color: '#0F172A', background: '#F8FAFC' }} />
              </div>
            </div>
            {msg && <div style={{ marginTop: 12, padding: '10px 14px', background: msg.startsWith('Error') ? '#FEF2F2' : '#D1FAE5', borderRadius: 8, fontSize: 13, fontWeight: 600, color: msg.startsWith('Error') ? '#DC2626' : '#065F46' }}>{msg}</div>}
            <button onClick={handleSave} disabled={saving} style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'linear-gradient(135deg,#001D39,#0A4174)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Subscription */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}><CreditCard size={16} /> Subscription</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Plan', value: co.subscription_plan?.replace('_',' ') },
                  { label: 'Status', value: co.subscription_status },
                  { label: 'Expires', value: co.subscription_end_date ? new Date(co.subscription_end_date).toLocaleDateString() : '—' },
                  { label: 'Days Left', value: co.days_left != null ? `${co.days_left} days` : '—' },
                  { label: 'Max Users', value: co.max_users },
                  { label: 'Max Jobs', value: co.max_jobs },
                  { label: 'AI Requests', value: co.max_ai_requests },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#94A3B8', fontWeight: 500 }}>{r.label}</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Change Plan</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {plans.map(p => (
                    <button key={p.id} onClick={() => handlePlanChange(p.id)}
                      style={{ padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${co.subscription_plan === p.id ? '#0A4174' : '#E2E8F0'}`, background: co.subscription_plan === p.id ? '#EFF6FF' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: co.subscription_plan === p.id ? '#0A4174' : '#475569', textAlign: 'left' }}>
                      {p.name} {p.monthly_price > 0 ? `— $${p.monthly_price}/mo` : '— Free'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Support Tickets */}
            {co.tickets?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#0F172A' }}>Support Tickets</h3>
                {co.tickets.slice(0,3).map(t => (
                  <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid #F8FAFC', fontSize: 13 }}>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>{t.subject}</div>
                    <div style={{ color: '#94A3B8', fontSize: 11 }}>{t.status} · {t.priority}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SALayout>
  );
}
