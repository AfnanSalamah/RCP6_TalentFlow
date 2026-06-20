import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  User,
  RefreshCw,
  X,
  Mail,
  Phone,
  Link as LinkIcon,
  FileText,
  CheckCircle,
  Send,
  CalendarPlus,
  Trash2,
} from "lucide-react";
import { interviewsApi } from "../../api/index";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

const EMPTY_NOTES = {
  technical_rating: 0,
  communication_rating: 0,
  problem_solving_rating: 0,
  domain_rating: 0,
  strengths: "",
  concerns: "",
  notes: "",
  recommendation: "",
};

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-lg ${n <= Number(value || 0) ? "text-amber-400" : "text-slate-300"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState({ ...EMPTY_NOTES });
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState("");
  const [notice, setNotice] = useState(null);

  const load = () => {
    setLoading(true);
    interviewsApi.hrList()
      .then((d) => setInterviews(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  async function openInterview(id) {
    const detail = await interviewsApi.hrGet(id);
    setSelected(detail);
    setNotes({ ...EMPTY_NOTES, ...(detail.notesForm || {}) });
    setNotice(null);
  }

  async function runAction(name, work, successMessage) {
    setAction(name);
    setNotice(null);
    try {
      await work();
      setNotice({ type: "success", message: successMessage });
    } catch (error) {
      setNotice({ type: "error", message: "Action could not be completed. Please try again." });
    } finally {
      setAction("");
    }
  }

  async function saveNotes() {
    if (!selected) return;
    setSaving(true);
    try {
      await interviewsApi.saveNotes(selected.id, notes);
      const detail = await interviewsApi.hrGet(selected.id);
      setSelected(detail);
      setNotes({ ...EMPTY_NOTES, ...(detail.notesForm || {}) });
      load();
      setNotice({ type: "success", message: "Interview notes saved successfully." });
    } catch (error) {
      setNotice({ type: "error", message: "Notes could not be saved. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(status) {
    if (!selected) return;
    await runAction(
      status,
      async () => {
        await interviewsApi.update(selected.id, { status });
        const detail = await interviewsApi.hrGet(selected.id);
        setSelected(detail);
        load();
      },
      status === "Completed"
        ? "Interview marked as completed."
        : "Follow-up status updated successfully."
    );
  }

  async function sendFeedback() {
    if (!selected) return;
    await runAction(
      "feedback",
      () => interviewsApi.sendFeedback(selected.id),
      "Interview feedback sent to the candidate."
    );
  }

  async function deleteSelectedInterview() {
    if (!selected) return;
    if (!window.confirm("Delete this interview? This action cannot be undone.")) return;
    const id = selected.id;
    setSelected(null);
    setInterviews((prev) => prev.filter((iv) => iv.id !== id));
    try {
      await interviewsApi.delete(id);
    } catch {
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Interview Management</h1>
          <p className="text-slate-500 text-sm mt-1">Review schedules, notes, evaluation, and candidate outcomes</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Interviews", value: interviews.length },
          { label: "Scheduled", value: interviews.filter((i) => i.status === "Scheduled").length },
          { label: "Completed", value: interviews.filter((i) => i.status === "Completed").length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-slate-800">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && <Card><CardContent className="py-8 text-center text-slate-500">Loading...</CardContent></Card>}
      {!loading && interviews.length === 0 && <Card><CardContent className="py-8 text-center text-slate-500">No interviews yet. Open a candidate and schedule an interview.</CardContent></Card>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interviews.map((iv) => (
          <button key={iv.id} onClick={() => openInterview(iv.id)} className="text-left">
            <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 hover:border-blue-200">
              <CardContent className="py-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-800">{iv.candidateName}</h3>
                    <p className="text-sm text-slate-500">{iv.roleTitle}</p>
                  </div>
                  <Badge label={iv.status} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600"><Mail size={14} />{iv.candidateEmail}</div>
                  <div className="flex items-center gap-2 text-sm text-slate-600"><Calendar size={14} />{iv.date}</div>
                  <div className="flex items-center gap-2 text-sm text-slate-600"><Clock size={14} />{iv.time}</div>
                  <div className="text-sm text-slate-600">
                    {iv.type === "Online"
                      ? `${iv.meetingProvider || "Online"}${iv.meetingUrl ? " link ready" : ""}`
                      : (iv.onsiteAddress || iv.location || iv.type)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex justify-end">
          <div className="w-full max-w-4xl bg-white h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Interview Details</h2>
                <p className="text-sm text-slate-500">{selected.candidateName} · {selected.roleTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={deleteSelectedInterview} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Delete interview"><Trash2 size={18} /></button>
                <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-slate-100"><X size={20} /></button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard title="Candidate" rows={[
                  ["Full Name", selected.candidateName, User],
                  ["Email", selected.candidateEmail, Mail],
                  ["Phone", selected.candidatePhone || "-", Phone],
                  ["Location", selected.candidateLocation || "-", LinkIcon],
                  ["Applied Role", selected.roleTitle || "-", FileText],
                  ["Headline", selected.candidateHeadline || "-", FileText],
                ]} resume={selected.resume} />
                <InfoCard title="Interview" rows={[
                  ["Date", selected.date || "-", Calendar],
                  ["Time", selected.time || "-", Clock],
                  ["Type", selected.type || "-", CalendarPlus],
                  ["Provider", selected.meetingProvider || (selected.type === "Online" ? "Online" : "On-site"), LinkIcon],
                  selected.type === "Online"
                    ? ["Meeting Link", selected.meetingUrl || "-", LinkIcon, selected.meetingUrl]
                    : ["Location", selected.onsiteAddress || selected.location || "-", LinkIcon],
                  ["Interviewer", selected.interviewer || "-", User],
                ]} />
              </div>
              {selected.candidateBio || selected.candidateSkills?.length ? (
                <Card>
                  <CardContent className="py-5 space-y-3">
                    <h3 className="font-semibold text-slate-800">Candidate Profile</h3>
                    {selected.candidateBio && <p className="text-sm text-slate-600 leading-relaxed">{selected.candidateBio}</p>}
                    {selected.candidateSkills?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selected.candidateSkills.map((skill) => (
                          <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{skill}</span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardContent className="py-5 space-y-5">
                  <h3 className="font-semibold text-slate-800">Interview Notes & Evaluation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      ["Technical Skills", "technical_rating"],
                      ["Communication", "communication_rating"],
                      ["Problem Solving", "problem_solving_rating"],
                      ["Domain Knowledge", "domain_rating"],
                    ].map(([label, key]) => (
                      <div key={key} className="p-3 rounded-xl bg-slate-50">
                        <div className="text-sm font-medium text-slate-700 mb-1">{label}</div>
                        <Stars value={notes[key]} onChange={(v) => setNotes({ ...notes, [key]: v })} />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextArea label="Strengths" value={notes.strengths} onChange={(v) => setNotes({ ...notes, strengths: v })} />
                    <TextArea label="Concerns" value={notes.concerns} onChange={(v) => setNotes({ ...notes, concerns: v })} />
                    <div className="md:col-span-2">
                      <TextArea label="Additional Notes" value={notes.notes} onChange={(v) => setNotes({ ...notes, notes: v })} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Recommendation</label>
                    <select
                      className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={notes.recommendation}
                      onChange={(e) => setNotes({ ...notes, recommendation: e.target.value })}
                    >
                      <option value="">Select recommendation</option>
                      {["Strong Hire", "Hire", "Maybe", "No Hire"].map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </CardContent>
              </Card>

              {notice && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                    notice.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {notice.message}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button onClick={saveNotes} disabled={saving || !!action} className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}>
                  {saving ? "Saving..." : "Save Notes"}
                </button>
                <button disabled={!!action || saving} onClick={sendFeedback} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  <Send size={15} /> {action === "feedback" ? "Sending..." : "Send Interview Feedback"}
                </button>
                <button disabled={!!action || saving} onClick={() => updateStatus("Rescheduled")} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  <CalendarPlus size={15} /> {action === "Rescheduled" ? "Updating..." : "Schedule Follow-up"}
                </button>
                <button disabled={!!action || saving || selected.status === "Completed"} onClick={() => updateStatus("Completed")} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                  <CheckCircle size={15} /> {action === "Completed" ? "Completing..." : "Mark Completed"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, rows, resume }) {
  return (
    <Card>
      <CardContent className="py-5">
        <h3 className="font-semibold text-slate-800 mb-4">{title}</h3>
        <div className="space-y-3">
          {rows.map(([label, value, Icon, href]) => (
            <div key={label} className="flex items-start gap-3">
              <Icon size={15} className="text-blue-500 mt-0.5" />
              <div>
                <p className="text-xs text-slate-400 font-medium">{label}</p>
                {href ? (
                  <a href={href} target="_blank" rel="noreferrer" className="text-sm text-blue-700 font-medium break-all hover:text-blue-900">
                    {value}
                  </a>
                ) : (
                  <p className="text-sm text-slate-700 font-medium break-all">{value}</p>
                )}
              </div>
            </div>
          ))}
          {resume && (
            <a href={resume.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900">
              <FileText size={15} /> {resume.fileName}
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
    </div>
  );
}
