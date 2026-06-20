import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, Calendar, Edit, MapPin, Plus, Trash2, Users } from "lucide-react";
import { hrProjectsApi, hrRolesApi } from "../../api/index";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

const PROJECT_FIELDS = ["name", "description", "location", "timeline", "priority", "status"];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [roleForm, setRoleForm] = useState({ title: "", open_positions: 1, required_skills: "", deadline: "", status: "Open" });

  const load = () => {
    setLoading(true);
    hrProjectsApi.get(id)
      .then((p) => {
        setProject(p);
        setForm(p || {});
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  async function saveProject() {
    const payload = {
      name: form.name || "",
      client: project.client || "",
      department: project.department || "",
      description: form.description || "",
      location: form.location || "",
      timeline: form.timeline || "",
      priority: form.priority || "Medium",
      status: form.status || "Active",
      progress: Number(project.progress || 0),
    };
    const saved = await hrProjectsApi.update(project.id, payload);
    setProject((prev) => ({ ...prev, ...saved }));
    setEditing(false);
  }

  async function addRole() {
    if (!roleForm.title.trim()) return;
    await hrRolesApi.create({
      project_id: project.id,
      title: roleForm.title.trim(),
      open_positions: Number(roleForm.open_positions) || 1,
      required_skills: roleForm.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
      preferred_skills: [],
      languages: [],
      location: project.location || "Remote",
      travel_requirement: "None",
      availability: "Immediate",
      contract_type: "Full-time",
      compensation_range: "Negotiable",
      deadline: roleForm.deadline || "",
      status: roleForm.status || "Open",
    });
    setRoleForm({ title: "", open_positions: 1, required_skills: "", deadline: "", status: "Open" });
    load();
  }

  async function deleteRole(roleId) {
    if (!window.confirm("Delete this role?")) return;
    await hrRolesApi.delete(roleId);
    load();
  }

  if (loading) return <Card><CardContent className="py-12 text-center text-slate-500">Loading project...</CardContent></Card>;
  if (!project) {
    return <div className="flex flex-col items-center justify-center h-96 gap-4">
      <p className="text-slate-500 text-lg">Project not found.</p>
      <button onClick={() => navigate("/hr/projects")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}><ArrowLeft size={15} /> Back to Projects</button>
    </div>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/hr/projects")} className="flex items-center gap-2 text-sm" style={{ color: "#49769F" }}><ArrowLeft size={15} /> Back to Hiring Projects</button>

      <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg,#001D39 0%,#0A4174 60%,#4E8EA2 100%)" }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2"><Badge label={project.status} /><Badge label={project.priority} /></div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-blue-200 mt-1">{project.client} · {project.department}</p>
            <p className="text-blue-100 text-sm mt-3 max-w-2xl leading-relaxed">{project.description || "No description."}</p>
          </div>
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 text-white text-sm hover:bg-white/25"><Edit size={15} /> Edit Project</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          {[
            { icon: Briefcase, label: "Total Roles", value: project.totalRoles ?? project.roles },
            { icon: Briefcase, label: "Open Roles", value: project.openRoles ?? 0 },
            { icon: Users, label: "Candidates", value: project.candidates ?? 0 },
            { icon: Users, label: "Hired", value: project.hired ?? 0 },
          ].map(({ icon: Icon, label, value }) => <div key={label} className="bg-white/10 rounded-xl px-4 py-3"><div className="flex items-center gap-2 mb-1"><Icon size={13} className="text-blue-300" /><span className="text-xs text-blue-300">{label}</span></div><p className="text-lg font-bold">{value}</p></div>)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold text-slate-800">Linked Roles</h2>
            <button onClick={addRole} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-xs" style={{ background: "#4E8EA2" }}><Plus size={13} /> Add Role</button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 grid grid-cols-5 gap-2 border-b border-slate-100 bg-slate-50">
              <input className="px-3 py-2 border border-slate-200 rounded-lg text-xs" placeholder="Role title" value={roleForm.title} onChange={(e) => setRoleForm({ ...roleForm, title: e.target.value })} />
              <input className="px-3 py-2 border border-slate-200 rounded-lg text-xs" placeholder="Openings" value={roleForm.open_positions} onChange={(e) => setRoleForm({ ...roleForm, open_positions: e.target.value })} />
              <input className="px-3 py-2 border border-slate-200 rounded-lg text-xs" placeholder="Skills" value={roleForm.required_skills} onChange={(e) => setRoleForm({ ...roleForm, required_skills: e.target.value })} />
              <input className="px-3 py-2 border border-slate-200 rounded-lg text-xs" placeholder="Deadline" value={roleForm.deadline} onChange={(e) => setRoleForm({ ...roleForm, deadline: e.target.value })} />
              <select className="px-3 py-2 border border-slate-200 rounded-lg text-xs" value={roleForm.status} onChange={(e) => setRoleForm({ ...roleForm, status: e.target.value })}><option>Open</option><option>Closed</option></select>
            </div>
            {(project.rolesList || []).length === 0 ? <div className="py-10 text-center text-slate-400 text-sm">No roles assigned yet.</div> : (
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">{["Role Name", "Openings", "Applicants", "Status", "Deadline", "Actions"].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">{h}</th>)}</tr></thead>
                <tbody>{project.rolesList.map((role) => (
                  <tr key={role.id} className="border-b border-slate-50">
                    <td className="px-5 py-3 text-sm font-medium text-slate-800">{role.title}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{role.openPositions}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{role.applicants ?? role.candidates}</td>
                    <td className="px-5 py-3"><Badge label={role.status} /></td>
                    <td className="px-5 py-3 text-sm text-slate-600">{role.deadline || "-"}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/hr/roles/${role.id}`)} className="text-xs text-blue-700 font-medium">View</button>
                        <button onClick={() => navigate(`/hr/roles/${role.id}`)} className="text-xs text-slate-600 font-medium">Edit</button>
                        <button onClick={() => deleteRole(role.id)} className="text-xs text-red-600 font-medium"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-slate-800">Project Details</h2></CardHeader>
          <CardContent className="space-y-3">
            <Info icon={MapPin} label="Location" value={project.location || "-"} />
            <Info icon={Calendar} label="Timeline" value={project.timeline || "-"} />
            <Info icon={UserIcon} label="Created By" value={project.createdBy || "-"} />
            <Info icon={Calendar} label="Created Date" value={project.createdAt || "-"} />
          </CardContent>
        </Card>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between"><h2 className="font-semibold text-slate-800 text-lg">Edit Project</h2><button onClick={() => setEditing(false)}>×</button></CardHeader>
            <CardContent className="space-y-4">
              {PROJECT_FIELDS.map((field) => field === "description" ? (
                <textarea key={field} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" placeholder={field} value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
              ) : (
                <input key={field} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" placeholder={field} value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
              ))}
              <div className="flex justify-end gap-3"><button onClick={() => setEditing(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl">Cancel</button><button onClick={saveProject} className="px-4 py-2 text-sm text-white rounded-xl" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}>Save</button></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return <div className="flex items-start gap-3"><Icon size={15} className="text-blue-500 mt-0.5" /><div><p className="text-xs text-slate-400">{label}</p><p className="text-sm font-medium text-slate-700">{value}</p></div></div>;
}

function UserIcon(props) {
  return <Users {...props} />;
}
