import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Clock,
  User,
  Star,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Brain,
  ThumbsUp,
  ThumbsDown,
  FileText,
  X,
  Check,
} from "lucide-react";
import { interviews, candidates } from "../data/mockData";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { StarRating } from "../components/ui/StarRating";

// ─── helpers ──────────────────────────────────────────────────────────────────
const AVATAR_BG = {
  0: ["#0A4174", "#BDD8E9"],
  1: ["#4E8EA2", "#EFF6FF"],
  2: ["#001D39", "#7BBDE8"],
  3: ["#49769F", "#E0F2FE"],
  4: ["#6EA2B3", "#DBEAFE"],
};
function avatarColors(id) {
  return AVATAR_BG[parseInt(id, 10) % 5] ?? ["#0A4174", "#BDD8E9"];
}

const RECO_STYLE = {
  "Strong Hire": {
    pill: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-300",
    label: "Strong Hire",
  },
  Hire: {
    pill: "bg-blue-100   text-blue-700",
    border: "border-blue-300",
    label: "Hire",
  },
  Maybe: {
    pill: "bg-amber-100  text-amber-700",
    border: "border-amber-300",
    label: "Consider",
  },
  "No Hire": {
    pill: "bg-red-100    text-red-700",
    border: "border-red-300",
    label: "Reject",
  },
  Pending: {
    pill: "bg-slate-100  text-slate-600",
    border: "border-slate-200",
    label: "Pending",
  },
};

function scoreFromRatings(iv) {
  const vals = [
    iv.technicalSkills,
    iv.communication,
    iv.domainExpertise,
    iv.availability,
  ].filter((v) => v > 0);
  if (!vals.length) return 0;
  return Math.round(
    (vals.reduce((a, b) => a + b, 0) / (vals.length * 5)) * 100,
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────
function RatingBar({ label, value, max = 5 }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const color =
    pct >= 80
      ? "#059669"
      : pct >= 60
        ? "#4E8EA2"
        : pct >= 40
          ? "#D97706"
          : "#DC2626";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">{label}</span>
        <div className="flex items-center gap-2">
          <StarRating rating={value} />
          <span className="text-xs font-semibold text-slate-500 w-8 text-right">
            {value}/{max}
          </span>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function TimelineStep({ label, done, active }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all"
        style={{
          background: done ? "#059669" : active ? "#0A4174" : "#E2E8F0",
          color: done || active ? "#fff" : "#94a3b8",
          boxShadow: active ? "0 0 0 4px rgba(10,65,116,0.18)" : "none",
        }}
      >
        {done ? <Check size={14} /> : <span className="text-xs">●</span>}
      </div>
      <span
        className={`text-xs text-center leading-tight font-medium ${active ? "text-blue-700" : done ? "text-emerald-700" : "text-slate-400"}`}
      >
        {label}
      </span>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function InterviewDetail() {
  const { candidateId } = useParams();
  const navigate = useNavigate();

  const interview = interviews.find((iv) => iv.candidateId === candidateId);
  const candidate = candidates.find((c) => c.id === candidateId);

  const [decision, setDecision] = useState("Pending");
  const [hireModal, setHireModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [toast, setToast] = useState(null);

  if (!interview || !candidate) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-slate-500 text-lg">Interview not found.</p>
        <button
          onClick={() => navigate("/hr/interviews")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm"
          style={{ background: "linear-gradient(135deg, #0A4174, #4E8EA2)" }}
        >
          <ArrowLeft size={15} /> Back to Interviews
        </button>
      </div>
    );
  }

  const score = scoreFromRatings(interview);
  const [bgColor, textColor] = avatarColors(candidate.id);
  const reco = RECO_STYLE[interview.recommendation] ?? RECO_STYLE["Pending"];

  const ratings = [
    { label: "Technical Skills", value: interview.technicalSkills },
    { label: "Communication", value: interview.communication },
    { label: "Domain Expertise", value: interview.domainExpertise },
    { label: "Availability", value: interview.availability },
    {
      label: "Problem Solving",
      value: Math.max(1, interview.technicalSkills - 1),
    },
    { label: "Leadership", value: Math.max(1, interview.communication - 1) },
  ];

  // timeline stages
  const stages = [
    "Applied",
    "Resume Reviewed",
    "Interview Scheduled",
    "Interview Completed",
    "Decision Made",
  ];
  const stageIndex =
    decision !== "Pending"
      ? 4
      : interview.status === "Completed"
        ? 3
        : interview.status === "Scheduled"
          ? 2
          : 1;

  function showToast(msg, color) {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3500);
  }

  function confirmHire() {
    setDecision("Hired");
    setHireModal(false);
    showToast("✓ Candidate has been moved to Hired status!", "#059669");
  }

  function confirmReject() {
    setDecision("Rejected");
    setRejectModal(false);
    showToast("Candidate has been rejected.", "#DC2626");
  }

  const decisionBadge =
    decision === "Hired"
      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
      : decision === "Rejected"
        ? "bg-red-100 text-red-700 border border-red-200"
        : "";

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white text-sm font-medium shadow-xl transition-all"
          style={{ background: toast.color, minWidth: 280 }}
        >
          <CheckCircle size={18} />
          {toast.msg}
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => navigate("/hr/interviews")}
        className="flex items-center gap-2 text-sm transition-colors font-medium"
        style={{ color: "#49769F" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#0A4174")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#49769F")}
      >
        <ArrowLeft size={15} /> Back to Interview Management
      </button>

      {/* ── Hero ── */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{
          background:
            "linear-gradient(135deg, #001D39 0%, #0A4174 55%, #4E8EA2 100%)",
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              backdropFilter: "blur(8px)",
            }}
          >
            {candidate.name.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{candidate.name}</h1>
              {decision !== "Pending" && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${decisionBadge}`}
                >
                  {decision}
                </span>
              )}
              {decision === "Pending" && (
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${reco.pill}`}
                >
                  {reco.label}
                </span>
              )}
            </div>
            <p className="text-blue-200 font-medium">{interview.roleTitle}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-blue-100">
              <span className="flex items-center gap-1.5">
                <Mail size={13} />
                {candidate.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone size={13} />
                {candidate.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {candidate.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase size={13} />
                {candidate.experience}
              </span>
            </div>
          </div>

          {/* Score bubble */}
          {score > 0 && (
            <div className="flex-shrink-0 text-center bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
              <p className="text-xs text-blue-200 mb-1">Overall Score</p>
              <p className="text-4xl font-bold">{score}%</p>
              <p className="text-xs text-blue-200 mt-1">{reco.label}</p>
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {candidate.skills.map((s) => (
            <span
              key={s}
              className="px-2.5 py-1 bg-white/15 rounded-full text-xs font-medium border border-white/20"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* ── Timeline ── */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Hiring Journey
          </h2>
          <div className="flex items-start gap-0">
            {stages.map((stage, i) => (
              <div key={stage} className="flex items-center flex-1">
                <TimelineStep
                  label={stage}
                  done={i < stageIndex}
                  active={i === stageIndex}
                />
                {i < stages.length - 1 && (
                  <div
                    className="h-0.5 flex-1 mx-1 rounded-full transition-all duration-500"
                    style={{
                      background: i < stageIndex ? "#059669" : "#E2E8F0",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col */}
        <div className="lg:col-span-2 space-y-5">
          {/* Interview Info */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-800">
                Interview Information
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { icon: Calendar, label: "Date", value: interview.date },
                  { icon: Clock, label: "Time", value: interview.time },
                  {
                    icon: User,
                    label: "Interviewer",
                    value: interview.interviewer,
                  },
                  {
                    icon: Briefcase,
                    label: "Role",
                    value: interview.roleTitle,
                  },
                  { icon: FileText, label: "Type", value: "Technical + HR" },
                  {
                    icon: CheckCircle,
                    label: "Status",
                    value: interview.status,
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={13} className="text-blue-400" />
                      <p className="text-xs text-slate-400 font-medium">
                        {label}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Evaluation */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                <h2 className="font-semibold text-slate-800">
                  Interview Evaluation
                </h2>
              </div>
            </CardHeader>
            <CardContent>
              {interview.status === "Completed" ? (
                <div className="space-y-4">
                  {ratings.map((r) => (
                    <RatingBar key={r.label} label={r.label} value={r.value} />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <Star size={32} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-sm">
                    Evaluation available after the interview is completed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-500" />
                <h2 className="font-semibold text-slate-800">
                  Interview Notes
                </h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Strengths */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp size={14} className="text-emerald-500" />
                  <p className="text-sm font-semibold text-slate-700">
                    Strengths
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800 leading-relaxed">
                  {interview.strengths || "No notes yet — interview pending."}
                </div>
              </div>

              {/* Concerns */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsDown size={14} className="text-amber-500" />
                  <p className="text-sm font-semibold text-slate-700">
                    Concerns / Weaknesses
                  </p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800 leading-relaxed">
                  {interview.concerns || "No concerns noted."}
                </div>
              </div>

              {/* Summary */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  Interview Summary
                </p>
                <textarea
                  rows={3}
                  defaultValue={
                    interview.strengths
                      ? `${interview.candidateName} performed well in the ${interview.roleTitle} interview. ${interview.strengths}. Overall a ${interview.recommendation} recommendation.`
                      : ""
                  }
                  placeholder="Add interview summary…"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
              </div>

              {/* AI Summary */}
              <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/60">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={15} className="text-blue-600" />
                  <p className="text-sm font-semibold text-blue-700">
                    AI Evaluation Summary
                  </p>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {interview.status === "Completed"
                    ? `Based on the evaluation scores, ${interview.candidateName} demonstrates strong proficiency in ${candidate.skills.slice(0, 2).join(" and ")}. With ${candidate.experience} of experience and a ${interview.recommendation} recommendation, this candidate aligns well with the ${interview.roleTitle} requirements. Confidence score: ${score}%.`
                    : "AI summary will be generated after the interview is completed and scores are submitted."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right col */}
        <div className="space-y-5">
          {/* Candidate Profile */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-800">
                Candidate Profile
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-center mb-2">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold"
                  style={{ background: bgColor, color: textColor }}
                >
                  {candidate.name.charAt(0)}
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800">{candidate.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {candidate.experience} experience
                </p>
              </div>

              <div className="space-y-2 pt-2">
                {[
                  { label: "Availability", value: candidate.availability },
                  { label: "Travel", value: candidate.travelWillingness },
                  { label: "Compensation", value: candidate.compensation },
                  { label: "Languages", value: candidate.languages.join(", ") },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-medium text-slate-700 text-right max-w-[55%] truncate">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map((s) => (
                    <span
                      key={s}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                <Download size={14} /> Download Resume
              </button>
            </CardContent>
          </Card>

          {/* Score Card */}
          {score > 0 && (
            <Card>
              <CardContent className="py-5 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">
                  Candidate Score
                </p>
                <div
                  className="w-28 h-28 rounded-full flex flex-col items-center justify-center mx-auto mb-3 border-4"
                  style={{
                    borderColor:
                      score >= 80
                        ? "#059669"
                        : score >= 60
                          ? "#4E8EA2"
                          : score >= 40
                            ? "#D97706"
                            : "#DC2626",
                    background:
                      score >= 80
                        ? "#ECFDF5"
                        : score >= 60
                          ? "#EFF6FF"
                          : score >= 40
                            ? "#FFFBEB"
                            : "#FEF2F2",
                  }}
                >
                  <span
                    className="text-3xl font-bold"
                    style={{
                      color:
                        score >= 80
                          ? "#059669"
                          : score >= 60
                            ? "#0A4174"
                            : score >= 40
                              ? "#D97706"
                              : "#DC2626",
                    }}
                  >
                    {score}%
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5">Overall</span>
                </div>
                <span
                  className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold ${reco.pill} border ${reco.border}`}
                >
                  {interview.recommendation}
                </span>
                <p className="text-xs text-slate-400 mt-2">
                  {score >= 80
                    ? "Recommended for Hiring"
                    : score >= 60
                      ? "Consider for Next Round"
                      : "Needs Further Review"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-800">Interview Info</h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { label: "Date", value: interview.date },
                { label: "Time", value: interview.time },
                { label: "Status", value: interview.status },
                { label: "Rating", value: `${interview.rating}/5` },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between py-1 border-b border-slate-50 last:border-0"
                >
                  <span className="text-slate-400">{label}</span>
                  <span className="font-medium text-slate-700">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Hiring Decision Panel ── */}
      {decision === "Pending" ? (
        <div
          className="rounded-2xl p-6 border-2 border-dashed border-slate-200 bg-white"
          style={{ borderColor: "#BDD8E9" }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Hiring Decision
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Make the final decision for{" "}
                <span className="font-medium text-slate-700">
                  {candidate.name}
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #DC2626, #EF4444)",
                }}
              >
                <XCircle size={16} /> Reject Candidate
              </button>
              <button
                onClick={() => setHireModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #059669, #10B981)",
                }}
              >
                <CheckCircle size={16} /> Hire Candidate
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-6 flex items-center gap-4"
          style={{
            background:
              decision === "Hired"
                ? "linear-gradient(135deg, #ECFDF5, #D1FAE5)"
                : "linear-gradient(135deg, #FEF2F2, #FEE2E2)",
            border: `2px solid ${decision === "Hired" ? "#6EE7B7" : "#FCA5A5"}`,
          }}
        >
          {decision === "Hired" ? (
            <CheckCircle size={28} className="text-emerald-600 flex-shrink-0" />
          ) : (
            <XCircle size={28} className="text-red-500    flex-shrink-0" />
          )}
          <div>
            <p
              className={`font-bold text-lg ${decision === "Hired" ? "text-emerald-700" : "text-red-700"}`}
            >
              {decision === "Hired" ? "Candidate Hired!" : "Candidate Rejected"}
            </p>
            <p className="text-sm text-slate-600 mt-0.5">
              {decision === "Hired"
                ? `${candidate.name} has been moved to Hired status. The offer process can now begin.`
                : `${candidate.name} has been rejected.${rejectReason ? ` Reason: ${rejectReason}` : ""}`}
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════ HIRE MODAL ═══════════════ */}
      {hireModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0,29,57,0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Hire Candidate?
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Are you sure you want to move{" "}
                <span className="font-semibold text-slate-800">
                  {candidate.name}
                </span>{" "}
                to <span className="font-semibold text-emerald-700">Hired</span>{" "}
                status?
                <br />
                This will update their pipeline stage and notify the team.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setHireModal(false)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmHire}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-colors"
                style={{
                  background: "linear-gradient(135deg, #059669, #10B981)",
                }}
              >
                <CheckCircle size={15} /> Confirm Hire
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ REJECT MODAL ═══════════════ */}
      {rejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0,29,57,0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-500" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Reject Candidate</h2>
                  <p className="text-xs text-slate-400">{candidate.name}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                >
                  <option value="">Select a reason…</option>
                  {[
                    "Skills not aligned with role",
                    "Compensation expectations too high",
                    "Cultural fit concerns",
                    "Availability mismatch",
                    "Better candidate selected",
                    "Position filled internally",
                    "Other",
                  ].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Additional Notes{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Add any additional context…"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setRejectModal(false)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #DC2626, #EF4444)",
                }}
              >
                <XCircle size={15} /> Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
