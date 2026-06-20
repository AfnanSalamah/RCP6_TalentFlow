import { useEffect, useState } from "react";
import {
  Plus,
  Grid,
  List,
  MapPin,
  Calendar,
  Users,
  Briefcase,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { hrProjectsApi } from "../../api/index";

const SAUDI_CITIES = ["Riyadh", "Jeddah", "Dammam", "Khobar", "Dhahran", "Jubail", "Makkah", "Madinah", "Tabuk", "NEOM", "Abha"];
const DEPARTMENTS = ["Technology", "Engineering", "Cybersecurity", "Data", "Human Resources", "Finance", "Operations", "Marketing", "Sales", "Legal"];
const CLIENTS = ["TalentFlow", "Saudi Aramco", "STC", "Elm", "Riyad Bank", "SABIC", "NEOM", "PIF", "Ministry", "Other"];
const toList = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

function ProjectCard({ project, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <Card className="h-full transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-1 group-hover:border-blue-200">
        <CardContent className="py-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 pr-3">
              <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors leading-snug">
                {project.name}
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">{project.client}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge label={project.status} />
              <ChevronRight
                size={15}
                className="text-slate-300 group-hover:text-blue-400 transition-colors"
              />
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
            {project.description}
          </p>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin size={12} className="flex-shrink-0" />
              <span className="truncate">{project.location}</span>
            </div>
            {/* Stop propagation on badge so its own click doesn't double-fire */}
            <div
              className="flex items-center gap-1.5 text-xs text-slate-500"
              onClick={(e) => e.stopPropagation()}
            >
              <Badge label={project.priority} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Briefcase size={12} className="flex-shrink-0" />
              {project.roles} roles
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Users size={12} className="flex-shrink-0" />
              {project.candidates} candidates
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">Progress</span>
              <span className="text-xs font-medium text-slate-700">
                {project.progress}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${project.progress}%`,
                  background: "linear-gradient(90deg, #4E8EA2, #0A4174)",
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-3">
            <Calendar size={11} />
            {project.timeline}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectRow({ project, onClick }) {
  return (
    <tr
      onClick={onClick}
      className="border-b border-slate-50 transition-all duration-150 group"
      style={{ cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
    >
      <td className="px-6 py-4">
        <p className="font-medium text-slate-800 group-hover:text-blue-700 transition-colors text-sm">
          {project.name}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{project.department}</p>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">{project.client}</td>
      <td className="px-6 py-4 text-sm text-slate-600">{project.location}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${project.progress}%`, background: "#4E8EA2" }}
            />
          </div>
          <span className="text-xs text-slate-500">{project.progress}%</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600 text-center">
        {project.roles}
      </td>
      <td className="px-6 py-4 text-sm text-slate-600 text-center">
        {project.candidates}
      </td>
      <td className="px-6 py-4">
        <Badge label={project.priority} />
      </td>
      <td className="px-6 py-4">
        <Badge label={project.status} />
      </td>
      <td className="px-6 py-4 text-slate-300 group-hover:text-blue-400 transition-colors">
        <ChevronRight size={16} />
      </td>
    </tr>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const [projectList, setProjectList] = useState([]);
  const [view, setView] = useState("grid");
  const [showForm, setShowForm] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState("");
  const [form, setForm] = useState({
    name: "",
    client: "",
    department: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    timeline: "",
    priority: "Medium",
    status: "Active",
    roleTitle: "",
    openings: "1",
    requiredSkills: "",
    preferredSkills: "",
    languages: "",
    contractType: "Full-time",
    compensation: "",
  });

  useEffect(() => {
    hrProjectsApi.list()
      .then((res) => setProjectList(res?.projects || []))
      .catch(() => setProjectList([]));
  }, []);

  useEffect(() => {
    if (!showForm) return;
    setCompaniesLoading(true);
    setCompaniesError("");
    hrProjectsApi.companies()
      .then((res) => setCompanies(res?.companies || []))
      .catch((err) => {
        console.error("[Projects] Failed to load companies", err);
        setCompaniesError(err?.message || "Could not load companies.");
        setCompanies([]);
      })
      .finally(() => setCompaniesLoading(false));
  }, [showForm]);

  async function handleCreateProject() {
    if (!form.name.trim() || !form.client || !form.description.trim() || !form.location || !form.roleTitle.trim()) return;
    const payload = {
      name: form.name,
      client: form.client,
      department: form.department,
      description: form.description,
      location: form.location,
      timeline: `${form.startDate || ""} to ${form.endDate || ""}`.trim(),
      priority: form.priority,
      status: form.status,
      progress: 0,
      hiring_requirements: [{
        title: form.roleTitle,
        openings: Number(form.openings) || 1,
        required_skills: toList(form.requiredSkills),
        preferred_skills: toList(form.preferredSkills),
        languages: toList(form.languages),
        contract_type: form.contractType,
        compensation: form.compensation,
      }],
    };
    try {
      const created = await hrProjectsApi.create(payload);
      setProjectList((prev) => [created, ...prev]);
    } catch (err) {
      console.error("[Projects] Create project failed", err);
      return;
    }
    setForm({
      name: "",
      client: "",
      department: "",
      description: "",
      location: "",
      startDate: "",
    endDate: "",
    timeline: "",
      priority: "Medium",
      status: "Active",
      roleTitle: "",
      openings: "1",
      requiredSkills: "",
      preferredSkills: "",
      languages: "",
      contractType: "Full-time",
      compensation: "",
    });
    setShowForm(false);
  }

  const projects = projectList;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hiring Projects</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage and track all hiring engagements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-lg transition-all ${view === "grid" ? "bg-white shadow-sm" : "text-slate-400"}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-white shadow-sm" : "text-slate-400"}`}
            >
              <List size={16} />
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: "linear-gradient(135deg, #0A4174, #4E8EA2)" }}
          >
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Projects", value: projects.length, icon: TrendingUp },
          {
            label: "Active",
            value: projects.filter((p) => p.status === "Active").length,
            icon: TrendingUp,
          },
          {
            label: "Completed",
            value: projects.filter((p) => p.status === "Completed").length,
            icon: TrendingUp,
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4 flex items-center gap-4">
              <div className="p-2 rounded-xl bg-blue-50">
                <s.icon size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grid / List */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onClick={() => navigate(`/hr/projects/${p.id}`)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {[
                  "Project",
                  "Client",
                  "Location",
                  "Progress",
                  "Roles",
                  "Candidates",
                  "Priority",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  onClick={() => navigate(`/hr/projects/${p.id}`)}
                />
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {projects.length === 0 && (
        <Card><CardContent className="py-12 text-center text-slate-400">No projects found in SQLite yet. Create a project to begin.</CardContent></Card>
      )}

      {/* Create Project Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="font-semibold text-slate-800 text-lg">
                Create New Project
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project / Job Name</label>
                  <input
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="e.g. Frontend Developer"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <p className="text-xs text-slate-400 mt-1">This will also publish an applicant-facing job automatically.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client / Company</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.client}
                    onChange={(e) => setForm({ ...form, client: e.target.value })}
                    disabled={companiesLoading}
                  >
                    <option value="">{companiesLoading ? "Loading companies..." : "Select company"}</option>
                    {(companies.length ? companies.map(c => c.company_name || c.name) : CLIENTS).map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                  {companiesError && <p className="text-xs text-red-500 mt-1">{companiesError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  >
                    <option value="">Select department</option>
                    {DEPARTMENTS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  >
                    <option value="">Select city</option>
                    {SAUDI_CITIES.map((v) => <option key={v} value={v}>{v}</option>)}
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End / Deadline</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Project description..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                  >
                    {["Low", "Medium", "High", "Critical"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    {["Active", "On Hold", "Completed"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                  <h3 className="font-semibold text-slate-800 mb-3">Hiring Requirements</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Role Title</label>
                      <input className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" value={form.roleTitle} onChange={(e) => setForm({ ...form, roleTitle: e.target.value })} placeholder="e.g. AI Instructor" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Openings</label>
                      <input className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" value={form.openings} onChange={(e) => setForm({ ...form, openings: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Contract Type</label>
                      <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })}>{["Full-time","Part-time","Contract","Freelance"].map((v) => <option key={v}>{v}</option>)}</select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills</label>
                      <input className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} placeholder="Python, Teaching, ML" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Skills</label>
                      <input className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" value={form.preferredSkills} onChange={(e) => setForm({ ...form, preferredSkills: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Languages</label>
                      <input className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="English, Arabic" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Compensation</label>
                      <input className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" value={form.compensation} onChange={(e) => setForm({ ...form, compensation: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  className="px-4 py-2 text-sm text-white rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, #0A4174, #4E8EA2)",
                  }}
                >
                  Create Project
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
