import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, Calendar, CheckCircle, DollarSign, Edit, Globe, MapPin, Plane, Users } from "lucide-react";
import { applicationsApi, hrRolesApi } from "../../api/index";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

const toCsv = (arr) => Array.isArray(arr) ? arr.join(", ") : "";
const fromCsv = (str) => String(str || "").split(",").map((x) => x.trim()).filter(Boolean);

export default function RoleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const load = () => {
    setLoading(true);
    hrRolesApi.get(id)
      .then((r) => {
        setRole(r);
        setForm({
          requiredSkills: toCsv(r.requiredSkills),
          preferredSkills: toCsv(r.preferredSkills),
          languages: toCsv(r.languages),
          compensationRange: r.compensationRange || "",
          deadline: r.deadline || "",
          openPositions: r.openPositions || 1,
          status: r.status || "Open",
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  async function saveRole() {
    await hrRolesApi.update(role.id, {
      project_id: role.projectId,
      title: role.title,
      open_positions: Number(form.openPositions) || 1,
      required_skills: fromCsv(form.requiredSkills),
      preferred_skills: fromCsv(form.preferredSkills),
      languages: fromCsv(form.languages),
      location: role.location || "Remote",
      travel_requirement: role.travelRequirement || "None",
      availability: role.availability || "Immediate",
      contract_type: role.contractType || "Full-time",
      compensation_range: form.compensationRange || "Negotiable",
      deadline: form.deadline || "",
      status: form.status || "Open",
    });
    setEditing(false);
    load();
  }

  async function moveStage(applicationId, stage, status) {
    await applicationsApi.updateStage(applicationId, { stage, status });
    load();
  }

  if (loading) return <Card><CardContent className="py-12 text-center text-slate-500">Loading role...</CardContent></Card>;
  if (!role) {
    return <div className="flex flex-col items-center justify-center h-96 gap-4">
      <p className="text-slate-500 text-lg">Role not found.</p>
      <button onClick={() => navigate("/hr/roles")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}><ArrowLeft size={15} /> Back to Roles</button>
    </div>;
  }

  const candidates = role.candidatesList || [];
  const details = [
    { icon: Briefcase, label: "Project Name", value: role.projectName || "-" },
    { icon: Users, label: "Openings", value: String(role.openPositions) },
    { icon: MapPin, label: "Location", value: role.location || "-" },
    { icon: Plane, label: "Travel Requirement", value: role.travelRequirement || "-" },
    { icon: Briefcase, label: "Contract Type", value: role.contractType || "-" },
    { icon: DollarSign, label: "Compensation", value: role.compensationRange || "-" },
    { icon: Calendar, label: "Deadline", value: role.deadline || "-" },
    { icon: Globe, label: "Languages", value: (role.languages || []).join(", ") || "-" },
  ];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/hr/roles")} className="flex items-center gap-2 text-sm" style={{ color: "#49769F" }}><ArrowLeft size={15} /> Back to Job Roles</button>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{role.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Badge label={role.status} />
            <span className="text-sm text-slate-500 flex items-center gap-1"><Briefcase size={13} /> {role.projectName || "No project"}</span>
            <span className="text-sm text-slate-500 flex items-center gap-1"><Users size={13} /> {role.openPositions} openings</span>
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}><Edit size={15} /> Edit Role</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          ["Applicants", role.applicants || 0],
          ["Shortlisted", role.shortlisted || 0],
          ["Interviewed", role.interviewed || 0],
          ["Recommended", role.recommended || 0],
          ["Hired", role.hired || 0],
        ].map(([label, value]) => (
          <Card key={label}><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-slate-800">{value}</p><p className="text-sm text-slate-500">{label}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader><h2 className="font-semibold text-slate-800">Role Details</h2></CardHeader>
            <CardContent><div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{details.map(({ icon: Icon, label, value }) => <div key={label} className="p-3 bg-slate-50 rounded-xl"><div className="flex items-center gap-1.5 mb-1"><Icon size={13} className="text-blue-500" /><p className="text-xs text-slate-400 font-medium">{label}</p></div><p className="text-sm font-semibold text-slate-700">{value}</p></div>)}</div></CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold text-slate-800">Skills</h2></CardHeader>
            <CardContent className="space-y-4">
              <SkillGroup title="Required Skills" items={role.requiredSkills || []} active />
              <SkillGroup title="Preferred Skills" items={role.preferredSkills || []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><h2 className="font-semibold text-slate-800">Candidates Assigned ({candidates.length})</h2><button onClick={() => navigate("/hr/candidates")} className="text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: "#4E8EA2" }}>View All</button></CardHeader>
            <CardContent className="p-0">
              {candidates.length === 0 ? <div className="py-10 text-center text-slate-400 text-sm">No candidates assigned yet.</div> : (
                <table className="w-full">
                  <thead><tr className="border-b border-slate-100">{["Candidate Name", "Status", "Rating", "Interview Status", "Actions"].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">{h}</th>)}</tr></thead>
                  <tbody>{candidates.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50">
                      <td className="px-5 py-3"><p className="text-sm font-medium text-slate-800">{c.name}</p><p className="text-xs text-slate-400">{c.email}</p></td>
                      <td className="px-5 py-3"><Badge label={c.status} /></td>
                      <td className="px-5 py-3 text-sm text-slate-600">{c.rating || "-"}</td>
                      <td className="px-5 py-3 text-sm text-slate-600">{c.interviewStatus || "-"}</td>
                      <td className="px-5 py-3"><div className="flex gap-2 flex-wrap">
                        <button onClick={() => navigate("/hr/candidates")} className="text-xs text-blue-700 font-medium">View Candidate</button>
                        <button onClick={() => navigate("/hr/interviews")} className="text-xs text-slate-700 font-medium">Schedule Interview</button>
                        <button onClick={() => moveStage(c.id, "Recommended", "Interviewed")} className="text-xs text-emerald-700 font-medium">Move Pipeline</button>
                      </div></td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Hiring Status</h2></CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Applicants", role.applicants || 0, "#7BBDE8"],
              ["Shortlisted", role.shortlisted || 0, "#4E8EA2"],
              ["Interviewed", role.interviewed || 0, "#49769F"],
              ["Recommended", role.recommended || 0, "#0A4174"],
              ["Hired", role.hired || 0, "#001D39"],
            ].map(([label, count, color]) => <FunnelRow key={label} label={label} count={count} total={role.applicants || 0} color={color} />)}
          </CardContent>
        </Card>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between"><h2 className="font-semibold text-slate-800 text-lg">Edit Role</h2><button onClick={() => setEditing(false)}>×</button></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {[
                ["Required Skills", "requiredSkills"],
                ["Preferred Skills", "preferredSkills"],
                ["Languages", "languages"],
                ["Compensation", "compensationRange"],
                ["Deadline", "deadline"],
                ["Openings", "openPositions"],
              ].map(([label, key]) => <div key={key} className={key.includes("Skills") ? "col-span-2" : ""}><label className="block text-sm font-medium text-slate-700 mb-1">{label}</label><input className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></div>)}
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" value={form.status || "Open"} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Open</option><option>Closed</option><option>Paused</option></select></div>
              <div className="col-span-2 flex justify-end gap-3 mt-2"><button onClick={() => setEditing(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl">Cancel</button><button onClick={saveRole} className="px-4 py-2 text-sm text-white rounded-xl" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}><CheckCircle size={15} className="inline mr-1" /> Save</button></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function SkillGroup({ title, items, active }) {
  return <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</p><div className="flex flex-wrap gap-2">{items.length ? items.map((s) => <span key={s} className={`px-3 py-1.5 rounded-xl text-sm font-medium border ${active ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-slate-50 text-slate-600 border-slate-200"}`}>{s}</span>) : <span className="text-sm text-slate-400">None</span>}</div></div>;
}

function FunnelRow({ label, count, total, color }) {
  return <div className="flex items-center justify-between"><span className="text-sm text-slate-600">{label}</span><div className="flex items-center gap-2"><div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: total ? `${(count / total) * 100}%` : "0%", background: color }} /></div><span className="text-sm font-semibold text-slate-700 w-4 text-right">{count}</span></div></div>;
}
