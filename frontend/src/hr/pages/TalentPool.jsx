import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle, Briefcase, Download, Loader2, Mail, MapPin, Pencil, RefreshCw,
  Search, Trash2, UserCheck,
} from "lucide-react";
import { talentPoolApi } from "../../api/index";
import { Card, CardContent } from "../components/ui/Card";

const STATUSES = ["All", "Available", "Contacted", "Hired", "Rejected"];
const EXPERIENCE = ["All", "0-2", "3-5", "6+"];

export default function TalentPool() {
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [experience, setExperience] = useState("All");
  const [savingId, setSavingId] = useState(null);
  const [draftNotes, setDraftNotes] = useState({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await talentPoolApi.list({ search, status, experience });
      setPool(Array.isArray(data) ? data : []);
      setDraftNotes(Object.fromEntries((Array.isArray(data) ? data : []).map((row) => [row.id, row.notes || ""])));
    } catch (e) {
      setError(e.message || "Failed to load Talent Pool.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search, status, experience]);

  const stats = useMemo(() => ({
    total: pool.length,
    available: pool.filter((c) => c.status === "Available").length,
    hired: pool.filter((c) => c.status === "Hired").length,
  }), [pool]);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  async function updateCandidate(id, data) {
    setSavingId(id);
    try {
      const updated = await talentPoolApi.update(id, data);
      setPool((prev) => prev.map((row) => (row.id === id ? updated : row)));
      showToast("success", "Talent Pool candidate updated.");
    } catch (e) {
      showToast("error", e.message || "Could not update candidate.");
    } finally {
      setSavingId(null);
    }
  }

  async function removeCandidate(id) {
    if (!window.confirm("Remove this candidate from Talent Pool?")) return;
    setSavingId(id);
    try {
      await talentPoolApi.remove(id);
      setPool((prev) => prev.filter((row) => row.id !== id));
      showToast("success", "Candidate removed from Talent Pool.");
    } catch (e) {
      showToast("error", e.message || "Could not remove candidate.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Talent Pool</h1>
          <p className="text-slate-500 text-sm mt-1">Saved candidates for future roles across your company.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {toast && <Notice type={toast.type} message={toast.message} />}
      {error && <Notice type="error" message={error} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Saved Candidates" value={stats.total} icon={UserCheck} />
        <Stat label="Available" value={stats.available} icon={Briefcase} />
        <Stat label="Hired" value={stats.hired} icon={UserCheck} />
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, skill, or role..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
              {STATUSES.map((s) => <option key={s} value={s}>{s === "All" ? "All statuses" : s}</option>)}
            </select>
            <select value={experience} onChange={(e) => setExperience(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
              {EXPERIENCE.map((e) => <option key={e} value={e}>{e === "All" ? "All experience" : `${e} years`}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px]">
            <thead>
              <tr className="border-b border-slate-100">
                {["Candidate", "Role / Skills", "Experience", "City", "Status", "Added", "Notes", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="8" className="px-5 py-12 text-center text-slate-500"><Loader2 className="inline mr-2 animate-spin" size={18} />Loading Talent Pool...</td></tr>
              )}
              {!loading && pool.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-5 py-14 text-center">
                    <div className="font-semibold text-slate-700">No saved candidates yet.</div>
                    <div className="text-sm text-slate-500 mt-1">Use Add to Talent Pool from the Candidates page.</div>
                  </td>
                </tr>
              )}
              {!loading && pool.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-blue-50/50">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-800">{c.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1"><Mail size={12} />{c.email}</div>
                    {c.phone && <div className="text-xs text-slate-400 mt-0.5">{c.phone}</div>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-700">{c.roleTitle || "Talent Pool Candidate"}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1 max-w-xs">
                      {(c.skills || []).slice(0, 5).map((s) => <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>)}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{c.experience || "-"}</td>
                  <td className="px-5 py-4 text-sm text-slate-600"><span className="inline-flex items-center gap-1"><MapPin size={12} />{c.city || "-"}</span></td>
                  <td className="px-5 py-4">
                    <select
                      value={c.status}
                      disabled={savingId === c.id}
                      onChange={(e) => updateCandidate(c.id, { status: e.target.value })}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                    >
                      {STATUSES.filter((s) => s !== "All").map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{c.createdAt || "-"}</td>
                  <td className="px-5 py-4">
                    <textarea
                      rows={2}
                      value={draftNotes[c.id] || ""}
                      onChange={(e) => setDraftNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      onBlur={() => updateCandidate(c.id, { notes: draftNotes[c.id] || "" })}
                      className="w-56 border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                      placeholder="Company notes"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {c.resume?.url && (
                        <a href={c.resume.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:text-blue-900" title="Open CV">
                          <Download size={16} />
                        </a>
                      )}
                      <button onClick={() => updateCandidate(c.id, { notes: draftNotes[c.id] || "" })} className="text-slate-600 hover:text-blue-700" title="Save notes">
                        <Pencil size={16} />
                      </button>
                      <button disabled={savingId === c.id} onClick={() => removeCandidate(c.id)} className="text-red-600 hover:text-red-700 disabled:opacity-50" title="Delete">
                        {savingId === c.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="py-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-50"><Icon size={18} className="text-blue-600" /></div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Notice({ type, message }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border ${type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
      <AlertCircle size={15} /> {message}
    </div>
  );
}
