import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SALayout from '../components/Layout';
import { saApi } from '../api/index';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Building2, TrendingUp, AlertTriangle, Users, UserCheck,
  Briefcase, DollarSign, Zap, Clock, ArrowUpRight,
} from 'lucide-react';

const PLAN_COLORS = { free_trial: '#94A3B8', basic: '#4E8EA2', professional: '#0A4174', enterprise: '#001D39' };
const PIE_COLORS = ['#001D39','#0A4174','#4E8EA2','#7BBDE8','#BDD8E9'];

function KpiCard({ label, value, sub, icon: Icon, color, bg, onClick }) {
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: onClick ? 'pointer' : 'default', border: '1px solid #F1F5F9', transition: 'all 0.15s' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
          <div style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          <Icon size={20} />
        </div>
      </div>
      {sub && <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, margin: 0 }}>{sub}</p>}
    </div>
  );
}

function Section({ title, children, action }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{title}</h3>
        {action}
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}

export default function SADashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    saApi.dashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <SALayout title="Dashboard">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#64748B' }}>Loading dashboard…</div>
    </SALayout>
  );

  const k = data?.kpis || {};
  const fmt = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n ?? 0);
  const money = (n) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n ?? 0}`;

  return (
    <SALayout title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* KPI Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <KpiCard label="Total Companies" value={fmt(k.total_companies)} icon={Building2} color="#001D39" bg="#EAF5FB" sub={`${k.active_companies} active`} onClick={() => navigate('/super-admin/companies')} />
          <KpiCard label="Expired Subs" value={fmt(k.expired_subscriptions)} icon={AlertTriangle} color="#DC2626" bg="#FEF2F2" sub="Need renewal" onClick={() => navigate('/super-admin/subscriptions')} />
          <KpiCard label="HR Users" value={fmt(k.total_hr_users)} icon={Users} color="#0A4174" bg="#EFF6FF" onClick={() => navigate('/super-admin/users')} />
          <KpiCard label="Candidates" value={fmt(k.total_applicants)} icon={UserCheck} color="#4E8EA2" bg="#EAF7FA" />
        </div>

        {/* KPI Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <KpiCard label="Active Jobs" value={fmt(k.total_jobs)} icon={Briefcase} color="#49769F" bg="#EDF6FB" />
          <KpiCard label="Applications" value={fmt(k.total_applications)} icon={TrendingUp} color="#4E8EA2" bg="#EAF7FA" />
          <KpiCard label="Monthly Revenue" value={money(k.monthly_revenue)} icon={DollarSign} color="#059669" bg="#D1FAE5" sub="Active subscriptions" />
          <KpiCard label="AI Requests" value={fmt(k.total_ai_requests)} icon={Zap} color="#7C3AED" bg="#F3E8FF" sub="Total lifetime" onClick={() => navigate('/super-admin/ai-usage')} />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <Section title="Company Growth (Last 6 Months)">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data?.subscription_growth || []}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A4174" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0A4174" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <Tooltip />
                <Area type="monotone" dataKey="companies" stroke="#0A4174" strokeWidth={2.5} fill="url(#cg)" />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Plan Distribution">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data?.plan_distribution || []} dataKey="count" nameKey="plan" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {(data?.plan_distribution || []).map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n.replace('_', ' ')]} />
                <Legend formatter={v => v.replace('_', ' ')} />
              </PieChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* AI Usage chart */}
        <Section title="AI Requests — Last 7 Days">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data?.ai_daily_usage || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <Tooltip />
              <Bar dataKey="requests" fill="#4E8EA2" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* Expiring soon */}
        {(data?.expiring_soon || []).length > 0 && (
          <Section title="⚠️ Subscriptions Expiring Soon" action={
            <button onClick={() => navigate('/super-admin/subscriptions')} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', color: '#64748B', fontWeight: 600 }}>
              View All
            </button>
          }>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data.expiring_soon).map(co => (
                <div key={co.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#FFFBEB', borderRadius: 10, border: '1px solid #FDE68A', cursor: 'pointer' }}
                  onClick={() => navigate(`/super-admin/companies/${co.id}`)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#92400E' }}>
                      {co.company_name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{co.company_name}</div>
                      <div style={{ fontSize: 12, color: '#92400E' }}>{co.subscription_plan.replace('_', ' ')} plan</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={14} color="#D97706" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#D97706' }}>{co.days_left} days left</span>
                    <ArrowUpRight size={14} color="#94A3B8" />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </SALayout>
  );
}
