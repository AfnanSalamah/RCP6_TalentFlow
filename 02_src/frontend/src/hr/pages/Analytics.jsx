import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { BarChart3, TrendingUp, Users, Trophy, Star, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { dashboardApi } from "../../api/index";
import { useEffect, useState } from "react";

const COLORS = ["#001D39", "#0A4174", "#49769F", "#4E8EA2", "#6EA2B3", "#7BBDE8", "#BDD8E9"];
const FUNNEL_FILLS = ["#001D39", "#0A4174", "#49769F", "#4E8EA2", "#6EA2B3", "#7BBDE8"];

// Build a decreasing hiring funnel from live pipeline-stage counts.
function buildFunnel(pipeline) {
  const c = Object.fromEntries((pipeline || []).map((p) => [p.stage, p.count]));
  const sum = (...stages) => stages.reduce((n, s) => n + (c[s] || 0), 0);
  const total = (pipeline || []).reduce((n, p) => n + p.count, 0);
  const rows = [
    { stage: "Applications", count: total },
    { stage: "Shortlisted", count: sum("Shortlisted", "Interview Scheduled", "Interviewed", "Recommended", "Offer Drafted", "Contract Sent", "Hired") },
    { stage: "Interviewed", count: sum("Interviewed", "Recommended", "Offer Drafted", "Contract Sent", "Hired") },
    { stage: "Offered", count: sum("Offer Drafted", "Contract Sent", "Hired") },
    { stage: "Hired", count: sum("Hired") },
  ];
  return rows.map((r, i) => ({ ...r, fill: FUNNEL_FILLS[i] }));
}

export default function Analytics() {
  const [a, setA] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true); setError("");
    dashboardApi.hrAnalytics()
      .then((d) => { if (alive) setA(d); })
      .catch((e) => { if (alive) setError(e.message || "Failed to load analytics."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-400 gap-2">
        <Loader2 className="animate-spin" size={22} /> Loading analytics…
      </div>
    );
  }
  if (error) {
    return <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>;
  }

  const k = a?.kpis || {};
  const pipeline = (a?.pipeline || []).filter((p) => p.count > 0);
  const funnel = buildFunnel(a?.pipeline || []);
  const monthly = a?.monthlyHiring || [];
  const statusData = a?.statusBreakdown || [];
  const skills = a?.skills || [];
  const empty = (k.totalApplications ?? 0) === 0;

  const kpis = [
    { label: "Total Candidates", value: k.totalCandidates ?? 0, icon: Users },
    { label: "Hired", value: k.hired ?? 0, icon: Trophy },
    { label: "Pipeline Conversion", value: `${k.conversionRate ?? 0}%`, icon: TrendingUp },
    { label: "Talent Pool", value: k.talentPool ?? 0, icon: Star },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl" style={{ background: "linear-gradient(135deg, #0A4174, #4E8EA2)" }}>
          <BarChart3 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-slate-500 text-sm">Live hiring insights from your pipeline</p>
        </div>
      </div>

      {empty && (
        <div className="p-5 rounded-xl bg-blue-50 border border-blue-100 text-sm text-slate-600">
          No applications yet — analytics populate automatically as candidates move through your pipeline.
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500">{kpi.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{kpi.value}</p>
                </div>
                <kpi.icon size={18} className="text-blue-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Hiring Funnel</h2></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {funnel.map((d) => {
                const pct = funnel[0].count ? (d.count / funnel[0].count) * 100 : 0;
                return (
                  <div key={d.stage} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-right text-slate-500">{d.stage}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-7 overflow-hidden">
                      <div className="h-full rounded-full flex items-center pl-3 transition-all"
                        style={{ width: `${Math.max(pct, d.count ? 6 : 0)}%`, background: d.fill, minWidth: d.count ? 40 : 0 }}>
                        <span className="text-white text-xs font-semibold">{d.count}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 w-10 text-right">{Math.round(pct)}%</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Candidates by Stage</h2></CardHeader>
          <CardContent>
            {pipeline.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={pipeline} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="stage" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {pipeline.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><h2 className="font-semibold text-slate-800">Monthly Hiring Trends</h2></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="candidates" stroke="#7BBDE8" strokeWidth={2} dot={{ r: 4 }} name="Candidates" />
                <Line type="monotone" dataKey="interviews" stroke="#4E8EA2" strokeWidth={2} dot={{ r: 4 }} name="Interviews" />
                <Line type="monotone" dataKey="hired" stroke="#0A4174" strokeWidth={2} dot={{ r: 4 }} name="Hired" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Stage Distribution</h2></CardHeader>
          <CardContent>
            {statusData.length ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {statusData.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color || COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600 flex-1">{s.name}</span>
                      <span className="font-semibold text-slate-700">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <Empty />}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <Card>
        <CardHeader><h2 className="font-semibold text-slate-800">Skills Demand</h2></CardHeader>
        <CardContent>
          {skills.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={skills}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="skill" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {skills.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty label="No candidate skills recorded yet" />}
        </CardContent>
      </Card>
    </div>
  );
}

function Empty({ label = "No data yet" }) {
  return <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">{label}</div>;
}
