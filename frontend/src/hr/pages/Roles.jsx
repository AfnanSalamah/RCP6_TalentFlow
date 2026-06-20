import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  MapPin,
  Users,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { hrRolesApi } from "../../api/index";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

const EMPTY_FORM = {
  title: "",
  openPositions: "",
  requiredSkills: "",
  preferredSkills: "",
  languages: "",
  location: "",
  travelRequirement: "None",
  availability: "",
  contractType: "Full-time",
  compensationRange: "",
  deadline: "",
};

export default function Roles() {
  const navigate = useNavigate();
  const [roleList, setRoleList] = useState([]);

  useEffect(() => {
    hrRolesApi.list()
      .then((res) => setRoleList(res?.roles || []))
      .catch(() => setRoleList([]));
  }, []);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // split comma-separated string into a clean array
  const toList = (s) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  function handleSubmit() {
    if (!form.title.trim()) return; // minimal guard

    const payload = {
      project_id: null,
      title: form.title.trim(),
      open_positions: Number(form.openPositions) || 1,
      required_skills: toList(form.requiredSkills),
      preferred_skills: toList(form.preferredSkills),
      languages: toList(form.languages),
      location: form.location.trim() || "Remote",
      travel_requirement: form.travelRequirement,
      availability: form.availability.trim() || "Immediate",
      contract_type: form.contractType,
      compensation_range: form.compensationRange.trim() || "Negotiable",
      deadline: form.deadline.trim() || "",
      status: "Open",
    };

    const optimistic = {
      id: `role-${Date.now()}`,
      projectId: "1",
      title: payload.title,
      openPositions: payload.open_positions,
      requiredSkills: payload.required_skills,
      preferredSkills: payload.preferred_skills,
      languages: payload.languages,
      location: payload.location,
      travelRequirement: payload.travel_requirement,
      availability: payload.availability,
      contractType: payload.contract_type,
      compensationRange: payload.compensation_range || "Negotiable",
      deadline: payload.deadline || "—",
      status: "Open",
      candidates: 0,
    };

    hrRolesApi.create(payload)
      .then((saved) => setRoleList((prev) => [saved, ...prev]))
      .catch(() => {});
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
  }

  const filtered = roleList.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.requiredSkills.some((s) =>
        s.toLowerCase().includes(search.toLowerCase()),
      );
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Job Roles</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage open positions and requirements
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ background: "linear-gradient(135deg, #0A4174, #4E8EA2)" }}
        >
          <Plus size={16} /> Create Role
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles or skills..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
        </div>
        <div className="flex gap-2">
          {["All", "Open", "Closed"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === s ? "text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
              style={
                filterStatus === s
                  ? { background: "linear-gradient(135deg, #0A4174, #4E8EA2)" }
                  : {}
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {[
                "Role Title",
                "Positions",
                "Required Skills",
                "Location",
                "Contract",
                "Compensation",
                "Deadline",
                "Candidates",
                "Status",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((role) => (
              <tr
                key={role.id}
                onClick={() => navigate(`/hr/roles/${role.id}`)}
                className="border-b border-slate-50 transition-all duration-150 group"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#EFF6FF")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">
                      {role.title}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-center text-slate-700 font-semibold">
                  {role.openPositions}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1">
                    {role.requiredSkills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                      >
                        {s}
                      </span>
                    ))}
                    {role.requiredSkills.length > 3 && (
                      <span className="text-xs text-slate-400">
                        +{role.requiredSkills.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <MapPin size={12} className="text-slate-400" />
                    {role.location}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {role.contractType}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <DollarSign size={12} className="text-slate-400" />
                    {role.compensationRange}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {role.deadline}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 text-sm text-slate-700 font-medium">
                    <Users size={12} className="text-slate-400" />
                    {role.candidates}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge label={role.status} />
                </td>
                <td className="px-5 py-4 text-slate-300 group-hover:text-blue-400 transition-colors">
                  <ChevronRight size={16} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            No roles match your search.
          </div>
        )}
      </Card>

      {/* Create Role Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-slate-800 text-lg">
                Create New Role
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
                {[
                  {
                    label: "Role Title",
                    key: "title",
                    placeholder: "e.g. Senior AI Engineer",
                    span: 2,
                  },
                  {
                    label: "Open Positions",
                    key: "openPositions",
                    placeholder: "1",
                    span: 1,
                  },
                  {
                    label: "Location",
                    key: "location",
                    placeholder: "e.g. Riyadh, KSA",
                    span: 1,
                  },
                  {
                    label: "Required Skills (comma-separated)",
                    key: "requiredSkills",
                    placeholder: "Python, TensorFlow, MLOps",
                    span: 2,
                  },
                  {
                    label: "Preferred Skills",
                    key: "preferredSkills",
                    placeholder: "Kubernetes, AWS",
                    span: 2,
                  },
                  {
                    label: "Languages",
                    key: "languages",
                    placeholder: "English, Arabic",
                    span: 1,
                  },
                  {
                    label: "Availability",
                    key: "availability",
                    placeholder: "Immediate",
                    span: 1,
                  },
                  {
                    label: "Compensation Range",
                    key: "compensationRange",
                    placeholder: "$100,000 – $130,000",
                    span: 1,
                  },
                  {
                    label: "Deadline",
                    key: "deadline",
                    placeholder: "2026-08-01",
                    span: 1,
                  },
                ].map((f) => (
                  <div
                    key={f.key}
                    className={`col-span-${f.span}`}
                    style={{ gridColumn: `span ${f.span}` }}
                  >
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {f.label}
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      onChange={(e) =>
                        setForm({ ...form, [f.key]: e.target.value })
                      }
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Travel Requirement
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.travelRequirement}
                    onChange={(e) =>
                      setForm({ ...form, travelRequirement: e.target.value })
                    }
                  >
                    {["None", "Minimal", "Occasional", "Frequent"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Contract Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.contractType}
                    onChange={(e) =>
                      setForm({ ...form, contractType: e.target.value })
                    }
                  >
                    {["Full-time", "Part-time", "Contract", "Freelance"].map(
                      (v) => (
                        <option key={v}>{v}</option>
                      ),
                    )}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setForm({ ...EMPTY_FORM });
                    setShowForm(false);
                  }}
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!form.title.trim()}
                  className="px-4 py-2 text-sm text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #0A4174, #4E8EA2)",
                  }}
                >
                  Create Role
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
