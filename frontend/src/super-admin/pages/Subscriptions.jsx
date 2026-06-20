import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SALayout from '../components/Layout';
import { saApi } from '../api/index';
import { CreditCard, AlertTriangle, CheckCircle, Clock, ChevronRight } from 'lucide-react';

export default function Subscriptions() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([saApi.listCompanies(), saApi.getPlans()])
      .then(([cos, ps]) => { setCompanies(cos); setPlans(ps); })
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const grouped = {
    active:   companies.filter(c => c.subscription_status === 'active' && c.is_active),
    expiring: companies.filter(c => c.days_left != null && c.days_left <= 30 && c.days_left > 0 && c.is_active),
    expired:  companies.filter(c => c.subscription_status === 'expired' || (c.subscription_end_date && new Date(c.subscription_end_date) < now)),
    suspended:companies.filter(c => !c.is_active || c.subscription_status === 'suspended'),
  };
  const display = filter === 'all' ? companies : grouped[filter] || companies;

  const planRevenue = plans.reduce((acc, p) => {
    const cnt = companies.filter(c => c.subscription_plan === p.id && c.is_active && c.subscription_status === 'active').length;
    acc[p.id] = { monthly: p.monthly_price * cnt, yearly: p.yearly_price * cnt, count: cnt };
    return acc;
  }, {});
  const totalMonthly = Object.values(planRevenue).reduce((s, r) => s + r.monthly, 0);

  return (
    <SALayout title="Subscriptions">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Revenue cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Monthly Revenue', value: `$${totalMonthly.toLocaleString()}`, icon: CreditCard, color: '#059669', bg: '#D1FAE5' },
            { label: 'Active', value: grouped.active.length, icon: CheckCircle, color: '#0A4174', bg: '#EFF6FF' },
            { label: 'Expiring Soon', value: grouped.expiring.length, icon: Clock, color: '#D97706', bg: '#FEF3C7' },
            { label: 'Expired', value: grouped.expired.length, icon: AlertTriangle, color: '#DC2626', bg: '#FEF2F2' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                <s.icon size={18} />
              </div>
            </div>
          ))}
        </div>

        {/* Plan breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {plans.map(p => (
            <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0A4174', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>{p.name}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>{planRevenue[p.id]?.count || 0}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>companies</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginTop: 6 }}>${planRevenue[p.id]?.monthly || 0}/mo</div>
              <div style={{ marginTop: 10, fontSize: 11, color: '#94A3B8' }}>
                Up to {p.max_users} users · {p.max_jobs} jobs
              </div>
            </div>
          ))}
        </div>

        {/* Filter + table */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['all', 'All'], ['active', 'Active'], ['expiring', 'Expiring'], ['expired', 'Expired'], ['suspended', 'Suspended']].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)}
                style={{ padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: filter === val ? '#0A4174' : '#F8FAFC', color: filter === val ? '#fff' : '#475569' }}>
                {lbl} {val !== 'all' && <span style={{ marginLeft: 4 }}>({grouped[val]?.length || 0})</span>}
              </button>
            ))}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Company', 'Plan', 'Status', 'Start', 'Expires', 'Days Left', ''].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #F1F5F9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading…</td></tr>
              : display.map(co => (
                <tr key={co.id} style={{ borderBottom: '1px solid #F8FAFC', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFBFF'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, color: '#0F172A' }}>{co.company_name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#0A4174', fontWeight: 600 }}>{co.subscription_plan?.replace('_',' ')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: co.subscription_status === 'active' ? '#D1FAE5' : co.subscription_status === 'expired' ? '#FEF3C7' : '#FEF2F2',
                      color: co.subscription_status === 'active' ? '#065F46' : co.subscription_status === 'expired' ? '#92400E' : '#DC2626' }}>
                      {co.subscription_status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#94A3B8' }}>{co.subscription_start_date ? new Date(co.subscription_start_date).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#94A3B8' }}>{co.subscription_end_date ? new Date(co.subscription_end_date).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: co.days_left != null && co.days_left <= 30 ? '#D97706' : '#475569' }}>
                    {co.days_left != null ? `${co.days_left}d` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => navigate(`/super-admin/companies/${co.id}`)} style={{ background: '#EFF6FF', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#0A4174' }}>
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SALayout>
  );
}
