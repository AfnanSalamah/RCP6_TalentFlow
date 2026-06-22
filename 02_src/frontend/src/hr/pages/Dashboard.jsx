import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import {
  FolderKanban, Briefcase, Users, UserCheck, Trophy, Star,
  Plus, ArrowRight, TrendingUp, Loader2, LifeBuoy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dashboardApi, applicationsApi } from "../../api/index";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

const COLORS = ["#7BBDE8", "#4E8EA2", "#49769F", "#0A4174", "#6EA2B3", "#BDD8E9", "#3d6b8a", "#1d4a6e"];

function KPICard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: color + "20" }}>
          <Icon size={22} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [dash, setDash] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [d, a, c] = await Promise.all([
          dashboardApi.hr(),
          dashboardApi.hrAnalytics(),
          applicationsApi.hrCandidates(),
        ]);
        if (!alive) return;
        setDash(d);
        setAnalytics(a);
        setCandidates(Array.isArray(c) ? c : []);
      } catch (e) {
        if (alive) setError(e.message || "Failed to load dashboard.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-400 gap-2">
        <Loader2 className="animate-spin" size={22} /> Loading live dashboard…
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  const k = dash?.kpis || {};
  const kpis = [
    { label: "Active Projects", value: k.activeProjects ?? 0, icon: FolderKanban, color: "#0A4174" },
    { label: "Open Roles", value: k.openRoles ?? 0, icon: Briefcase, color: "#49769F" },
    { label: "Candidates", value: k.totalCandidates ?? 0, icon: Users, color: "#001D39" },
    { label: "Interviews", value: k.interviewsScheduled ?? 0, icon: UserCheck, color: "#49769F" },
    { label: "Hired", value: k.hired ?? 0, icon: Trophy, color: "#0A4174" },
    { label: "Talent Pool", value: k.talentPool ?? 0, icon: Star, color: "#001D39" },
  ];

  const pipeline = (analytics?.pipeline || []).filter((p) => p.count > 0);
  const statusData = analytics?.statusBreakdown || [];
  const monthly = analytics?.monthlyHiring || [];
  const skills = analytics?.skills || [];
  const upcomingInterviews = dash?.upcomingInterviews || [];
  const recentCandidates = candidates.slice(0, 6);
  const hasData = (k.totalCandidates ?? 0) > 0 || (k.activeProjects ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="rounded-xl p-6 flex items-center justify-between border border-slate-100"
        style={{ background: "linear-gradient(135deg, #001D39 0%, #0A4174 100%)" }}>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.png" alt="TalentFlow" className="w-10 h-10 object-contain rounded-lg bg-white/15 p-1" />
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome back</h1>
              <p className="text-blue-200 text-sm">AI-Powered Hiring &amp; Talent Pool Management</p>
            </div>
          </div>
          <p className="text-blue-100 mt-2 text-sm">
            You have {upcomingInterviews.length} upcoming interview{upcomingInterviews.length === 1 ? "" : "s"} and {k.openRoles ?? 0} open role{k.openRoles === 1 ? "" : "s"} today.
          </p>
        </div>
        <div className="hidden md:flex gap-2">
          {[
            { label: "Create Project", to: "/hr/projects", icon: FolderKanban },
            { label: "Candidates", to: "/hr/candidates", icon: Users },
            { label: "Help & Support", to: "/hr/support", icon: LifeBuoy },
          ].map(({ label, to, icon: Icon }) => (
            <button key={to} onClick={() => navigate(to)}
              className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-sm transition-all border border-white/20">
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => <KPICard key={kpi.label} {...kpi} />)}
      </div>

      {!hasData && (
        <div className="p-5 rounded-xl bg-blue-50 border border-blue-100 text-sm text-slate-600">
          No hiring data yet. Create a project or role, and candidates &amp; analytics will appear here automatically.
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Hiring Pipeline Distribution</h2></CardHeader>
          <CardContent>
            {pipeline.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={pipeline} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#49769F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Candidates by Stage</h2></CardHeader>
          <CardContent>
            {statusData.length ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {statusData.map((entry, index) => <Cell key={index} fill={entry.color || COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {statusData.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color || COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600 flex-1 truncate">{s.name}</span>
                      <span className="font-semibold text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <EmptyChart />}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Monthly Hiring Trends</h2></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="candidates" stroke="#7BBDE8" strokeWidth={2} dot={{ r: 4 }} name="Candidates" />
                <Line type="monotone" dataKey="interviews" stroke="#49769F" strokeWidth={2} dot={{ r: 4 }} name="Interviews" />
                <Line type="monotone" dataKey="hired" stroke="#0A4174" strokeWidth={2} dot={{ r: 4 }} name="Hired" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Top Skills in Demand</h2></CardHeader>
          <CardContent>
            {skills.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={skills} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="skill" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#0A4174" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart label="No candidate skills yet" />}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent candidates */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold text-slate-800">Recent Candidates</h2>
            <button onClick={() => navigate("/hr/candidates")}
              className="text-sm text-blue-700 hover:text-blue-800 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {recentCandidates.length ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Name", "Role", "Skills", "Stage", "Applied"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentCandidates.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
                            style={{ background: "linear-gradient(135deg, #0A4174, #49769F)" }}>
                            {(c.name || "?").charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-800">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">{c.roleTitle || "—"}</td>
                      <td className="px-6 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {(c.skills || []).slice(0, 2).map((s) => (
                            <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3"><Badge label={c.stage} /></td>
                      <td className="px-6 py-3 text-sm text-slate-500">{c.appliedDate || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-6 py-8 text-sm text-slate-400 text-center">No candidates yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming interviews */}
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Upcoming Interviews</h2></CardHeader>
          <CardContent className="space-y-3">
            {upcomingInterviews.length ? upcomingInterviews.map((iv) => (
              <div key={iv.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => navigate("/hr/interviews")}>
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#0A4174" }} />
                <div>
                  <p className="text-sm font-medium text-slate-800">{iv.candidateName}</p>
                  <p className="text-xs text-slate-500">{iv.roleTitle}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#0A4174" }}>{iv.date} · {iv.time}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-400 py-4 text-center">No upcoming interviews.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardContent className="py-5">
          <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Create Project", to: "/hr/projects", color: "#0A4174" },
              { label: "Create Role", to: "/hr/roles", color: "#49769F" },
              { label: "Candidates", to: "/hr/candidates", color: "#001D39" },
              { label: "AI Assistant", to: "/hr/ai-assistant", color: "#49769F" },
            ].map(({ label, to, color }) => (
              <button key={to} onClick={() => navigate(to)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90"
                style={{ background: color }}>
                <Plus size={16} /> {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart({ label = "No data yet" }) {
  return (
    <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
      {label}
    </div>
  );
}
