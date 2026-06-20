import { useState, useEffect } from 'react';
import SALayout from '../components/Layout';
import { saApi } from '../api/index';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Zap, TrendingUp, Activity, Cpu } from 'lucide-react';

export default function AIUsage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange]     = useState(30);

  useEffect(() => {
    setLoading(true);
    saApi.getAIUsage({ days: range }).then(setData).finally(() => setLoading(false));
  }, [range]);

  if (loading || !data) return (
    <SALayout title="AI Usage"><div style={{ padding: 60, textAlign: 'center', color: '#94A3B8' }}>Loading analytics…</div></SALayout>
  );

  const statCards = [
    { label: 'Total Requests', value: (data.total_requests || 0).toLocaleString(), icon: Activity, color: '#0A4174', bg: '#EFF6FF' },
    { label: 'Total Tokens', value: (data.total_tokens || 0).toLocaleString(), icon: Zap, color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Avg Tokens/Req', value: data.total_requests ? Math.round(data.total_tokens / data.total_requests).toLocaleString() : '0', icon: TrendingUp, color: '#059669', bg: '#D1FAE5' },
    { label: 'Active Models', value: data.by_model?.length || 0, icon: Cpu, color: '#D97706', bg: '#FEF3C7' },
  ];

  return (
    <SALayout title="AI Usage">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setRange(d)}
              style={{ padding: '7px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: range === d ? '#0A4174' : '#F8FAFC', color: range === d ? '#fff' : '#475569', transition: 'all 0.12s' }}>
              {d}d
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                <s.icon size={18} />
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
          {/* Daily usage */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 20px', color: '#0F172A' }}>Daily Requests</h3>
            {data.daily?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.daily} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => v?.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E2E8F0' }} />
                  <Line type="monotone" dataKey="requests" stroke="#0A4174" strokeWidth={2.5} dot={false} name="Requests" />
                  <Line type="monotone" dataKey="tokens" stroke="#7BBDE8" strokeWidth={2} dot={false} name="Tokens" />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No usage data in this period</div>}
          </div>

          {/* By action */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 20px', color: '#0F172A' }}>By Action</h3>
            {data.by_action?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.by_action} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="action" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E2E8F0' }} />
                  <Bar dataKey="count" fill="#4E8EA2" radius={[4,4,0,0]} name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No data</div>}
          </div>
        </div>

        {/* Per-company usage table */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', fontWeight: 700, fontSize: 14, color: '#0F172A' }}>Per-Company Usage</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Company', 'Requests', 'Tokens Used', 'Top Action', 'Limit'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #F1F5F9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.by_company?.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>No company usage data</td></tr>
              ) : data.by_company?.map(c => (
                <tr key={c.company_id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, color: '#0F172A' }}>{c.company_name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#0A4174', fontWeight: 700 }}>{(c.requests || 0).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{(c.tokens || 0).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>{c.top_action || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {c.max_ai_requests > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden', maxWidth: 100 }}>
                          <div style={{ height: '100%', borderRadius: 99, background: c.requests / c.max_ai_requests > 0.8 ? '#DC2626' : '#0A4174', width: `${Math.min(100, (c.requests / c.max_ai_requests) * 100)}%` }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>{c.max_ai_requests.toLocaleString()}</span>
                      </div>
                    ) : <span style={{ fontSize: 11, color: '#94A3B8' }}>Unlimited</span>}
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
