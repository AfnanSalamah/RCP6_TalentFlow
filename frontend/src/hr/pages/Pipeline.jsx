import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { applicationsApi } from "../../api/index";

const STAGES = [
  "New",
  "Resume Reviewed",
  "Shortlisted",
  "Interview Scheduled",
  "Interviewed",
  "Recommended",
  "Offer Drafted",
  "Contract Sent",
  "Hired",
  "Rejected",
  "Talent Pool",
];

const stageColors = {
  New: "#7BBDE8",
  "Resume Reviewed": "#6EA2B3",
  Shortlisted: "#4E8EA2",
  "Interview Scheduled": "#49769F",
  Interviewed: "#3d6b8a",
  Recommended: "#2d5a7d",
  "Offer Drafted": "#1d4a6e",
  "Contract Sent": "#0f3b5f",
  Hired: "#0A4174",
  Rejected: "#ef4444",
  "Talent Pool": "#6EA2B3",
};

function buildBoard(candidates) {
  const map = {};
  STAGES.forEach((s) => { map[s] = []; });
  candidates.forEach((c) => {
    const stage = STAGES.includes(c.stage) ? c.stage : "New";
    map[stage].push(c);
  });
  return map;
}

export default function Pipeline() {
  const [board, setBoard] = useState(() => buildBoard([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await applicationsApi.hrCandidates();
        if (alive) setBoard(buildBoard(Array.isArray(data) ? data : []));
      } catch (e) {
        if (alive) setError(e.message || "Failed to load pipeline.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleDragStart = (candidateId, fromStage) => setDragging({ candidateId, fromStage });

  const handleDrop = async (toStage) => {
    if (!dragging || dragging.fromStage === toStage) { setDragging(null); return; }
    const { candidateId, fromStage } = dragging;
    setDragging(null);

    // Optimistic move
    const prevBoard = board;
    const candidate = board[fromStage].find((c) => c.id === candidateId);
    if (!candidate) return;
    setBoard((prev) => ({
      ...prev,
      [fromStage]: prev[fromStage].filter((c) => c.id !== candidateId),
      [toStage]: [...prev[toStage], { ...candidate, stage: toStage }],
    }));

    // Persist to backend; revert on failure
    setSaving(true);
    try {
      await applicationsApi.updateStage(candidateId, { stage: toStage, status: toStage });
    } catch (e) {
      setBoard(prevBoard);
      setError(e.message || "Could not save the stage change.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-400 gap-2">
        <Loader2 className="animate-spin" size={22} /> Loading pipeline…
      </div>
    );
  }

  const totalCandidates = STAGES.reduce((n, s) => n + (board[s]?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hiring Pipeline</h1>
          <p className="text-slate-500 text-sm mt-1">
            Drag and drop candidates across hiring stages — changes save instantly.
          </p>
        </div>
        {saving && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Loader2 className="animate-spin" size={14} /> Saving…
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {totalCandidates === 0 ? (
        <div className="p-8 rounded-xl bg-blue-50 border border-blue-100 text-center text-sm text-slate-500">
          No candidates in the pipeline yet. They appear here once applicants apply to your roles.
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.map((stage) => (
              <div
                key={stage}
                className="w-56 flex-shrink-0"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(stage)}
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: stageColors[stage] }} />
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{stage}</h3>
                  <span className="ml-auto text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                    {board[stage]?.length || 0}
                  </span>
                </div>

                <div className="min-h-24 space-y-2 rounded-2xl p-2 bg-slate-50/80 border border-slate-100">
                  {board[stage]?.map((candidate) => (
                    <div
                      key={candidate.id}
                      draggable
                      onDragStart={() => handleDragStart(candidate.id, stage)}
                      className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${stageColors[stage]}, #001D39)` }}
                        >
                          {(candidate.name || "?").charAt(0)}
                        </div>
                        <p className="text-xs font-semibold text-slate-800 leading-tight truncate">
                          {candidate.name}
                        </p>
                      </div>
                      {candidate.roleTitle && (
                        <p className="text-xs text-slate-500 mb-2 truncate">{candidate.roleTitle}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {(candidate.skills || []).slice(0, 2).map((s) => (
                          <span key={s} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {board[stage]?.length === 0 && (
                    <div className="flex items-center justify-center h-16 text-xs text-slate-300 italic">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {STAGES.map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: stageColors[s] }} />
            {s} ({board[s]?.length || 0})
          </div>
        ))}
      </div>
    </div>
  );
}
