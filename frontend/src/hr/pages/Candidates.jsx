import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Mail,
  MapPin,
  CalendarClock,
  RefreshCw,
  Plus,
  Upload,
  ExternalLink,
  Loader2,
  AlertCircle,
  Phone,
  Briefcase,
  Trash2,
} from "lucide-react";
import { applicationsApi, interviewsApi, aiApi, hrRolesApi, talentPoolApi } from "../../api/index";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

const PROVIDERS = ["Google Meet", "Zoom", "Microsoft Teams"];

export default function Candidates() {
  const [apps, setApps] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [poolAddingId, setPoolAddingId] = useState(null);
  const [toast, setToast] = useState(null);

  const load = () => {
    setLoading(true);
    applicationsApi.hrCandidates()
      .then((data) => setApps(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function deleteCandidate(candidate) {
    if (!window.confirm(`Delete ${candidate.name || "this candidate"}? This action cannot be undone.`)) return;
    setApps((prev) => prev.filter((a) => a.id !== candidate.id));
    try {
      await applicationsApi.deleteCandidate(candidate.id);
    } catch {
      load();
    }
  }

  async function addToTalentPool(candidate) {
    setPoolAddingId(candidate.id);
    setToast(null);
    try {
      await talentPoolApi.add(candidate.id);
      setToast({ type: "success", message: `${candidate.name || "Candidate"} added to Talent Pool.` });
    } catch (e) {
      setToast({ type: "error", message: e.message || "Could not add candidate to Talent Pool." });
    } finally {
      setPoolAddingId(null);
      setTimeout(() => setToast(null), 3500);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return apps.filter((a) =>
      !q ||
      a.name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.roleTitle?.toLowerCase().includes(q)
    );
  }, [apps, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Candidates</h1>
          <p className="text-slate-500 text-sm mt-1">Add candidates, review profiles, upload resumes, and schedule interviews</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}>
            <Plus size={16} /> Add Candidate
          </button>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          {toast && <Notice type={toast.type} message={toast.message} />}
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidate, email, or role..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead><tr className="border-b border-slate-100">{["Candidate","Applied Role","Stage","Status","Date",""].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan="6" className="px-5 py-8 text-center text-slate-500">No candidates yet. Add a candidate or wait for portal applications.</td></tr>}
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-blue-50/60 cursor-pointer" onClick={() => setSelected(a)}>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-800">{a.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1"><Mail size={12} />{a.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-700">{a.roleTitle || "Manual Candidate"}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={12} />{a.location || "-"}</div>
                  </td>
                  <td className="px-5 py-4"><Badge label={a.stage} /></td>
                  <td className="px-5 py-4"><Badge label={a.status} /></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{a.appliedDate}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button onClick={(e) => { e.stopPropagation(); setSelected(a); }} className="text-blue-700 text-sm font-semibold hover:text-blue-900">Open</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); addToTalentPool(a); }}
                        disabled={poolAddingId === a.id}
                        className="inline-flex items-center gap-1 text-emerald-700 text-sm font-semibold hover:text-emerald-900 disabled:opacity-50"
                      >
                        {poolAddingId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        Add to Talent Pool
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteCandidate(a); }} className="text-red-600 hover:text-red-700" title="Delete candidate"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && <CandidateModal app={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); load(); }} />}
      {adding && <AddCandidateModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
    </div>
  );
}

function AddCandidateModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", role_id: "", job_id: "", role_title: "", location: "", skills: "", years_of_experience: "0", notes: "" });
  const [roles, setRoles] = useState([]);
  const [manualRole, setManualRole] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    hrRolesApi.list()
      .then((data) => {
        if (!alive) return;
        const rows = Array.isArray(data?.roles) ? data.roles : [];
        setRoles(rows.filter((r) => String(r.status || "").toLowerCase() !== "closed"));
      })
      .catch(() => alive && setRoles([]));
    return () => { alive = false; };
  }, []);

  function chooseRole(value) {
    if (value === "__manual__") {
      setManualRole(true);
      setForm((f) => ({ ...f, role_id: "", job_id: "", role_title: "" }));
      return;
    }
    const role = roles.find((r) => String(r.id) === value);
    setManualRole(false);
    setForm((f) => ({
      ...f,
      role_id: role?.id || "",
      job_id: role?.publishedJobId || "",
      role_title: role?.title || "",
      location: f.location || role?.location || "",
      skills: f.skills || [...(role?.requiredSkills || []), ...(role?.preferredSkills || [])].join(", "),
    }));
  }

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setMessage("Name and email are required.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await applicationsApi.createCandidate({
        ...form,
        role_id: form.role_id ? Number(form.role_id) : null,
        job_id: form.job_id ? Number(form.job_id) : null,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      onSaved();
    } catch (e) {
      setMessage(e.message || "Could not add candidate.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Add Candidate" onClose={onClose} maxWidth="max-w-3xl">
      {message && <Notice type="error" message={message} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Role / Position</span>
          <select
            value={manualRole ? "__manual__" : (form.role_id ? String(form.role_id) : "")}
            onChange={(e) => chooseRole(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          >
            <option value="">Select an open role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.title}{role.projectName ? ` - ${role.projectName}` : ""} ({role.openPositions || 1})
              </option>
            ))}
            <option value="__manual__">Manual role</option>
          </select>
        </label>
        {manualRole && <Field label="Manual role title" value={form.role_title} onChange={(v) => setForm({ ...form, role_title: v })} />}
        <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
        <Field label="Years of experience" value={form.years_of_experience} onChange={(v) => setForm({ ...form, years_of_experience: v })} />
        <div className="md:col-span-2">
          <Field label="Skills, separated by commas" value={form.skills} onChange={(v) => setForm({ ...form, skills: v })} />
        </div>
        <div className="md:col-span-2">
          <TextArea label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium">Cancel</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}>
          {saving ? "Adding..." : "Add Candidate"}
        </button>
      </div>
    </ModalShell>
  );
}

function CandidateModal({ app, onClose, onSaved }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [interviewType, setInterviewType] = useState("Online");
  const [provider, setProvider] = useState("Google Meet");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [onsiteAddress, setOnsiteAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [notice, setNotice] = useState(null);

  const schedule = async () => {
    if (!date || !time) return setNotice({ type: "error", message: "Choose interview date and time." });
    if (interviewType === "Online" && !meetingUrl.trim()) return setNotice({ type: "error", message: "Add the online meeting link." });
    if (interviewType === "On-site" && !onsiteAddress.trim()) return setNotice({ type: "error", message: "Add the on-site address." });
    setSaving(true);
    setNotice(null);
    try {
      await interviewsApi.schedule({
        application_id: app.id,
        date,
        time,
        interview_type: interviewType,
        meeting_provider: interviewType === "Online" ? provider : "",
        meeting_url: interviewType === "Online" ? meetingUrl.trim() : "",
        onsite_address: interviewType === "On-site" ? onsiteAddress.trim() : "",
        location: interviewType === "Online" ? meetingUrl.trim() : onsiteAddress.trim(),
      });
      setNotice({ type: "success", message: "Interview scheduled and the candidate will see the details." });
      setTimeout(onSaved, 700);
    } catch (e) {
      setNotice({ type: "error", message: e.message || "Could not schedule interview." });
    } finally {
      setSaving(false);
    }
  };

  const updateStage = async (status, stage) => {
    setSaving(true);
    setNotice(null);
    try {
      await applicationsApi.updateStage(app.id, { status, stage, note: `HR updated application to ${status}` });
      setNotice({ type: "success", message: "Candidate status updated." });
      setTimeout(onSaved, 600);
    } catch (e) {
      setNotice({ type: "error", message: e.message || "Could not update candidate." });
    } finally {
      setSaving(false);
    }
  };

  const uploadAndAnalyze = async () => {
    if (!file) return setNotice({ type: "error", message: "Choose a resume file first." });
    setUploading(true);
    setNotice(null);
    try {
      const uploaded = await applicationsApi.uploadCandidateResume(app.id, file);
      const result = await aiApi.resumeAnalysis({ application_id: app.id }).catch(() => null);
      setAnalysis({ ...(result || {}), ...(uploaded || {}) });
      setNotice({ type: "success", message: "Resume uploaded and analyzed." });
    } catch (e) {
      setNotice({ type: "error", message: e.message || "Resume upload or analysis failed." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <ModalShell title={app.name} onClose={onClose} maxWidth="max-w-4xl">
      {notice && <Notice type={notice.type} message={notice.message} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <Info label="Email" value={app.email} icon={Mail} />
        <Info label="Phone" value={app.phone || "-"} icon={Phone} />
        <Info label="Role" value={app.roleTitle || "-"} icon={Briefcase} />
        <Info label="Location" value={app.location || "-"} icon={MapPin} />
        <Info label="Status" value={app.status} />
        <Info label="Stage" value={app.stage} />
        <Info label="Applied" value={app.appliedDate} />
        <Info label="Experience" value={app.yearsOfExperience ? `${app.yearsOfExperience} years` : "-"} />
        <Info className="md:col-span-2" label="Skills" value={(app.skills || []).join(", ") || "-"} />
        <Info className="md:col-span-2" label="Profile" value={app.bio || app.headline || app.notes || "-"} />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button disabled={saving} onClick={() => updateStage("Under Review", "Resume Reviewed")} className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold disabled:opacity-50">Mark Under Review</button>
        <button disabled={saving} onClick={() => updateStage("Shortlisted", "Shortlisted")} className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold disabled:opacity-50">Shortlist</button>
        <button disabled={saving} onClick={() => updateStage("Rejected", "Rejected")} className="px-3 py-2 rounded-xl bg-red-50 text-red-700 text-sm font-semibold disabled:opacity-50">Reject</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="font-semibold mb-3 flex items-center gap-2"><Upload size={16} /> Resume</div>
          {app.resume?.url && (
            <a href={app.resume.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mb-3 text-sm font-medium text-blue-700 hover:text-blue-900">
              <ExternalLink size={14} /> {app.resume.fileName || "Open resume"}
            </a>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-600 file:mr-3 file:px-3 file:py-2 file:rounded-xl file:border-0 file:bg-white file:text-slate-700 file:font-medium" />
            <button onClick={uploadAndAnalyze} disabled={uploading} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white hover:bg-slate-50 disabled:opacity-60">
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Analyze
            </button>
          </div>
          {analysis && (
            <div className="mt-3 rounded-xl bg-white border border-slate-100 p-3 text-sm">
              <div className="font-semibold text-slate-800">Score: {Math.round(analysis.resume_score || analysis.ai_score || 0)}%</div>
              <p className="text-slate-600 mt-1">{analysis.summary || "Analysis completed."}</p>
              {(analysis.skills_extracted?.length > 0 || analysis.extracted_profile?.skills?.length > 0) && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Skills</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(analysis.skills_extracted || analysis.extracted_profile?.skills || []).slice(0, 12).map((skill) => (
                      <span key={skill} className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              {analysis.extracted_profile?.education?.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Education</div>
                  {analysis.extracted_profile.education.slice(0, 3).map((edu, i) => (
                    <div key={i} className="text-xs text-slate-600">{edu.degree} {edu.university ? `- ${edu.university}` : ""}</div>
                  ))}
                </div>
              )}
              {analysis.extracted_profile?.experience?.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Experience</div>
                  {analysis.extracted_profile.experience.slice(0, 3).map((exp, i) => (
                    <div key={i} className="text-xs text-slate-600">{exp.title} {exp.company ? `at ${exp.company}` : ""}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="font-semibold mb-3 flex items-center gap-2"><CalendarClock size={16} /> Schedule Interview</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 bg-white" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {["Online", "On-site"].map((type) => (
              <button key={type} onClick={() => setInterviewType(type)} className={`px-3 py-2 rounded-xl text-sm font-semibold border ${interviewType === type ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600"}`}>
                {type}
              </button>
            ))}
          </div>
          {interviewType === "Online" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <select value={provider} onChange={(e) => setProvider(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 bg-white">
                {PROVIDERS.map((p) => <option key={p}>{p}</option>)}
              </select>
              <input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="Meeting link" className="border border-slate-200 rounded-xl px-3 py-2 bg-white" />
            </div>
          ) : (
            <input value={onsiteAddress} onChange={(e) => setOnsiteAddress(e.target.value)} placeholder="Interview location / address" className="mt-3 w-full border border-slate-200 rounded-xl px-3 py-2 bg-white" />
          )}
          <button disabled={saving} onClick={schedule} className="mt-3 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}>
            {saving ? "Saving..." : "Schedule Interview"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children, maxWidth = "max-w-2xl" }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-slate-800 text-lg">{title}</h2>
          <button onClick={onClose} className="text-xl text-slate-500 hover:text-slate-900">x</button>
        </CardHeader>
        <CardContent className="space-y-5">{children}</CardContent>
      </Card>
    </div>
  );
}

function Notice({ type, message }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border ${type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
      <AlertCircle size={15} /> {message}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
    </label>
  );
}

function Info({ label, value, icon: Icon, className = "" }) {
  return (
    <div className={`p-3 bg-slate-50 rounded-xl ${className}`}>
      <div className="text-xs text-slate-400 flex items-center gap-1">{Icon && <Icon size={12} />}{label}</div>
      <div className="font-medium text-slate-700 break-words">{value}</div>
    </div>
  );
}
