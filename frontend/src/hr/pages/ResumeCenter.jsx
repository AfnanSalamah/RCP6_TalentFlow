import { useEffect, useState } from "react";
import { FileText, Brain, CheckCircle, Star, Loader2, AlertCircle, Upload } from "lucide-react";
import { applicationsApi, aiApi } from "../../api/index";
import { Card, CardContent, CardHeader } from "../components/ui/Card";

export default function ResumeCenter() {
  const [resumeList, setResumeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError("");
    applicationsApi.hrResumes()
      .then((data) => {
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        setResumeList(list);
        if (list.length) selectResume(list[0]);
      })
      .catch((e) => { if (alive) setError(e.message || "Failed to load resumes."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectResume(r) {
    setSelected(r);
    setAnalysis(null);
    if (!r) return;
    setAnalyzing(true);
    try {
      // Server-side analysis only — no fabrication on the client.
      const res = await aiApi.resumeAnalysis({ application_id: r.id });
      setAnalysis(res);
    } catch (e) {
      setError(e.message || "Analysis failed.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setAnalyzing(false);
    }
  }

  async function uploadAndAnalyze() {
    if (!selected || !uploadFile) {
      setError("Choose a candidate and a resume file first.");
      setTimeout(() => setError(""), 3500);
      return;
    }
    setUploading(true);
    setError("");
    try {
      await applicationsApi.uploadCandidateResume(selected.id, uploadFile);
      const fresh = await applicationsApi.hrResumes();
      const list = Array.isArray(fresh) ? fresh : [];
      setResumeList(list);
      const updated = list.find((r) => r.id === selected.id) || selected;
      setUploadFile(null);
      await selectResume(updated);
    } catch (e) {
      setError(e.message || "Resume upload failed.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-400 gap-2">
        <Loader2 className="animate-spin" size={22} /> Loading candidate resumes…
      </div>
    );
  }

  const score = analysis?.resume_score ?? selected?.aiScore ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Resume Center</h1>
        <p className="text-slate-500 text-sm mt-1">
          AI analysis of resumes from candidates who applied to your roles.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {resumeList.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-400">
            No candidate resumes yet. They appear here when applicants apply to your roles.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resume List */}
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-700">Candidates ({resumeList.length})</h2>
            {resumeList.map((r) => (
              <div
                key={r.id}
                onClick={() => selectResume(r)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${selected?.id === r.id ? "border-blue-300 bg-blue-50" : "border-slate-100 bg-white hover:border-slate-200"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-50 rounded-xl">
                    <FileText size={16} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{r.candidateName}</p>
                    <p className="text-xs text-slate-400 truncate">{r.fileName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {r.uploadDate && <span className="text-xs text-slate-400">Uploaded {r.uploadDate}</span>}
                      {!r.hasResume && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">No file</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Analysis Panel */}
          {selected && (
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-700">AI Analysis — {selected.candidateName}</h2>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-white text-sm"
                  style={{ background: "linear-gradient(135deg, #0A4174, #4E8EA2)" }}>
                  <Brain size={14} /> AI Powered
                </div>
              </div>

              <Card>
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Upload or replace resume</p>
                      <p className="text-xs text-slate-400 mt-1">The uploaded file is analyzed immediately for this candidate.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-600 file:mr-3 file:px-3 file:py-2 file:rounded-xl file:border-0 file:bg-slate-50 file:text-slate-700 file:font-medium" />
                      <button onClick={uploadAndAnalyze} disabled={uploading} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}>
                        {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Analyze
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {analyzing ? (
                <Card>
                  <CardContent className="py-16 flex flex-col items-center text-slate-400">
                    <Loader2 className="animate-spin mb-3" size={28} />
                    Running AI analysis…
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Score */}
                  {score != null && (
                    <Card>
                      <CardContent className="py-5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-medium text-slate-700">Resume Score</p>
                            <p className="text-xs text-slate-400">AI-assessed quality &amp; ATS readiness</p>
                          </div>
                          <div className="text-3xl font-bold" style={{ color: "#0A4174" }}>{Math.round(score)}%</div>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${score}%`, background: "linear-gradient(90deg, #7BBDE8, #0A4174)" }} />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Summary */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Brain size={16} className="text-blue-600" />
                        <h3 className="font-semibold text-slate-800">AI Resume Summary</h3>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {analysis?.summary || "No summary available — the candidate may not have uploaded a resume yet."}
                      </p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader><h3 className="font-semibold text-slate-800 text-sm">Candidate Skills</h3></CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {(selected.skills || []).length
                            ? selected.skills.map((s) => (
                                <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{s}</span>
                              ))
                            : <span className="text-xs text-slate-400">None listed</span>}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><h3 className="font-semibold text-slate-800 text-sm">ATS Score</h3></CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Star size={16} className="text-amber-400 fill-amber-400" />
                          <span className="font-semibold text-slate-800">
                            {analysis?.ats_score != null ? `${Math.round(analysis.ats_score)}%` : (selected.atsScore != null ? `${Math.round(selected.atsScore)}%` : "—")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Strengths / Missing */}
                  {(analysis?.strengths?.length || analysis?.missing_skills?.length) ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-emerald-600" />
                          <h3 className="font-semibold text-slate-800">Strengths &amp; Gaps</h3>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysis?.strengths?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">Strengths</p>
                            <div className="flex flex-wrap gap-2">
                              {analysis.strengths.map((s, i) => (
                                <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium border border-emerald-100">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {analysis?.missing_skills?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">Missing / to develop</p>
                            <div className="flex flex-wrap gap-2">
                              {analysis.missing_skills.map((s, i) => (
                                <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-medium border border-amber-100">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : null}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
