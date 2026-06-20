import { useState, useEffect } from "react";
import { interviewsApi } from "../../api/index";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Mail,
  Send,
  Check,
  X,
  Plus,
  Bell,
  User,
  Users,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  ExternalLink,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building2,
  Layers,
  Car,
  Navigation2,
  Monitor,
  Globe,
  Link2,
  CalendarPlus,
  Eye,
  CalendarCheck,
  Loader,
  Sparkles,
  Copy,
  Printer,
  MoreVertical,
  Search,
  Star,
} from "lucide-react";
import { candidates } from "../data/mockData";

// â”€â”€â”€ MOCK DATA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const INITIAL_INTERVIEWS = [];
const MEETING_PLATFORMS = [
  { id: "Zoom", label: "Zoom", icon: Video, color: "#2D8CFF" },
  {
    id: "Microsoft Teams",
    label: "Microsoft Teams",
    icon: Monitor,
    color: "#6264A7",
  },
  { id: "Google Meet", label: "Google Meet", icon: Globe, color: "#00AC47" },
  { id: "Custom Link", label: "Custom Link", icon: Link2, color: "#64748B" },
];

const STATUS_CONFIG = {
  Scheduled: { color: "#0A4174", bg: "#EFF6FF", icon: Calendar },
  "Invitation Sent": { color: "#7C3AED", bg: "#F5F3FF", icon: Send },
  Confirmed: { color: "#059669", bg: "#ECFDF5", icon: CheckCircle },
  Rescheduled: { color: "#D97706", bg: "#FFFBEB", icon: RefreshCw },
  Completed: { color: "#1E293B", bg: "#F8FAFC", icon: CheckCircle },
  "No Show": { color: "#DC2626", bg: "#FEF2F2", icon: AlertCircle },
  Cancelled: { color: "#6B7280", bg: "#F9FAFB", icon: XCircle },
};

const EMPTY_FORM = {
  candidateName: "",
  candidateEmail: "",
  candidatePhone: "",
  jobRole: "",
  department: "",
  interviewType: "Online",
  date: "",
  time: "",
  duration: "60 min",
  interviewer: "",
  panel: "",
  notes: "",
  platform: "Zoom",
  meetingUrl: "",
  officeLocation: "TalentFlow HQ, Riyadh",
  building: "Innovation Tower",
  floor: "",
  room: "",
  mapsLink: "",
  parking: "",
  reception: "",
};

// â”€â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function generateEmail(f, type) {
  const isOnline = type === "Online" || type === "Hybrid";
  const isOnSite = type === "On-Site" || type === "Hybrid";
  const fmtDate = f.date
    ? new Date(f.date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "[DATE]";
  const fmtTime = f.time ? f.time + " AST" : "[TIME]";

  return `Subject: Interview Invitation â€“ ${f.jobRole || "[Job Role]"} at TalentFlow

â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

Dear ${f.candidateName || "[Candidate Name]"},

We are pleased to invite you to an interview for the position of ${f.jobRole || "[Job Role]"} at TalentFlow HR Solutions.

Please review the interview details below:

ðŸ“…  Date:              ${fmtDate}
â°  Time:              ${fmtTime}
â±ï¸  Duration:          ${f.duration}
ðŸŽ¯  Interview Type:    ${type}
ðŸ‘¤  Interviewer:       ${f.interviewer || "[Interviewer]"}
${f.panel ? `ðŸ‘¥  Interview Panel:   ${f.panel}` : ""}
${
  isOnline
    ? `
ðŸ”—  ONLINE MEETING DETAILS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Platform:    ${f.platform}
Meeting URL: ${f.meetingUrl || "[Meeting Link will be provided]"}

Please join the meeting 5 minutes before the scheduled time.`
    : ""
}
${
  isOnSite
    ? `
ðŸ“  ON-SITE LOCATION DETAILS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Office:      ${f.officeLocation}
Building:    ${f.building}${f.floor ? `\nFloor:       ${f.floor}` : ""}${f.room ? `\nRoom:        ${f.room}` : ""}${f.mapsLink ? `\nGoogle Maps: ${f.mapsLink}` : ""}${f.parking ? `\n\nðŸš— Parking Instructions:\n${f.parking}` : ""}${f.reception ? `\n\nðŸ¢ Reception Information:\n${f.reception}` : ""}`
    : ""
}
${f.notes ? `\nðŸ“  Additional Notes:\n${f.notes}` : ""}

â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

Please confirm your attendance by replying to this email or clicking the confirmation link below.

If you need to reschedule, please contact us at least 24 hours in advance.

We look forward to speaking with you!

Best regards,
TalentFlow HR Team
hr@talentflow.ai  |  +966 11 000 0000
www.talentflow.ai`;
}

// â”€â”€â”€ STATUS BADGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{
        color: cfg.color,
        background: cfg.bg,
        borderColor: cfg.color + "30",
      }}
    >
      <Icon size={11} /> {status}
    </span>
  );
}

// â”€â”€â”€ TYPE BADGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TypeBadge({ type }) {
  const styles = {
    Online: "bg-blue-50 text-blue-700 border-blue-200",
    "On-Site": "bg-teal-50 text-teal-700 border-teal-200",
    Hybrid: "bg-purple-50 text-purple-700 border-purple-200",
  };
  const icons = { Online: Video, "On-Site": MapPin, Hybrid: Layers };
  const Icon = icons[type];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[type]}`}
    >
      <Icon size={11} /> {type}
    </span>
  );
}

// â”€â”€â”€ KPI CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function KpiCard({ label, value, icon: Icon, color, bg, sublabel }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 flex items-center gap-4">
      <div className="p-3 rounded-2xl flex-shrink-0" style={{ background: bg }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500 leading-tight">{label}</p>
        {sublabel && (
          <p className="text-xs font-medium mt-0.5" style={{ color }}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ INTERVIEW CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function InterviewCard({ interview, onStatusChange, onView }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const nextStatuses = [
    "Invitation Sent",
    "Confirmed",
    "Completed",
    "Rescheduled",
    "No Show",
    "Cancelled",
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #001D39, #0A4174)",
              }}
            >
              {interview.candidateName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                {interview.candidateName}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {interview.jobRole}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <TypeBadge type={interview.interviewType} />
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <MoreVertical size={15} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1">
                  <button
                    onClick={() => {
                      onView(interview);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Eye size={13} /> View Details
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <p className="px-3 py-1 text-xs font-semibold text-slate-400">
                    Update Status
                  </p>
                  {nextStatuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        onStatusChange(interview.id, s);
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      <ChevronRight size={11} /> {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar size={12} className="text-slate-400 flex-shrink-0" />
            {interview.date} Â· {interview.time} Â· {interview.duration}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <User size={12} className="text-slate-400 flex-shrink-0" />
            {interview.interviewer}
          </div>
          {interview.interviewType !== "On-Site" && interview.meetingUrl && (
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <Video size={12} className="flex-shrink-0" />
              <a
                href={interview.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:underline truncate"
              >
                {interview.platform}
              </a>
            </div>
          )}
          {interview.interviewType !== "Online" && interview.officeLocation && (
            <div className="flex items-center gap-2 text-xs text-teal-600">
              <MapPin size={12} className="flex-shrink-0" />
              <span className="truncate">
                {interview.building}, {interview.room}
              </span>
            </div>
          )}
        </div>

        {/* Status row */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <StatusBadge status={interview.status} />
          <div className="flex gap-1.5">
            {!interview.invitationSent && (
              <button
                onClick={() => onStatusChange(interview.id, "Invitation Sent")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                style={{ background: "#7C3AED" }}
              >
                <Send size={11} /> Send Invite
              </button>
            )}
            <button
              onClick={() => onView(interview)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Eye size={11} /> View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ SCHEDULE MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ScheduleModal({ onClose, onSave, defaultCandidate }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    candidateName: defaultCandidate || "",
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const emailText = generateEmail(form, form.interviewType);

  const f = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      const newIv = {
        id: `IV-${String(Math.floor(Math.random() * 900) + 100)}`,
        ...form,
        status: "Scheduled",
        invitationSent: false,
        createdAt: new Date().toISOString().split("T")[0],
      };
      onSave(newIv);
      setSaving(false);
    }, 1000);
  }

  function copyEmail() {
    navigator.clipboard.writeText(emailText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputCls =
    "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400";
  const labelCls =
    "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

  const candidateSuggestions = candidates
    .filter(
      (c) =>
        c.name.toLowerCase().includes(form.candidateName.toLowerCase()) &&
        form.candidateName.length > 0,
    )
    .slice(0, 4);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,29,57,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
          style={{ background: "linear-gradient(135deg, #001D39, #0A4174)" }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15">
              <CalendarPlus size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">Schedule Interview</h2>
              <p className="text-blue-200 text-xs">Step {step} of 4</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          {["Basic Info", "Interview Details", "Email Preview", "Confirm"].map(
            (s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background:
                        step > i + 1
                          ? "#059669"
                          : step === i + 1
                            ? "#0A4174"
                            : "#E2E8F0",
                      color: step >= i + 1 ? "#fff" : "#94a3b8",
                    }}
                  >
                    {step > i + 1 ? <Check size={12} /> : i + 1}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${step === i + 1 ? "text-blue-700" : step > i + 1 ? "text-emerald-700" : "text-slate-400"}`}
                  >
                    {s}
                  </span>
                </div>
                {i < 3 && (
                  <div
                    className="flex-1 h-0.5 rounded-full mx-1"
                    style={{ background: step > i + 1 ? "#059669" : "#E2E8F0" }}
                  />
                )}
              </div>
            ),
          )}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Candidate Name with suggestions */}
                <div className="col-span-2 relative">
                  <label className={labelCls}>Candidate Name *</label>
                  <input
                    value={form.candidateName}
                    onChange={f("candidateName")}
                    placeholder="Start typing candidate nameâ€¦"
                    className={inputCls}
                  />
                  {candidateSuggestions.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                      {candidateSuggestions.map((c) => (
                        <button
                          key={c.id}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 text-left"
                          onClick={() =>
                            setForm({
                              ...form,
                              candidateName: c.name,
                              candidateEmail: c.email,
                              candidatePhone: c.phone,
                            })
                          }
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{
                              background:
                                "linear-gradient(135deg, #0A4174, #4E8EA2)",
                            }}
                          >
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {c.name}
                            </p>
                            <p className="text-xs text-slate-400">{c.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelCls}>Email *</label>
                  <input
                    type="email"
                    value={form.candidateEmail}
                    onChange={f("candidateEmail")}
                    placeholder="candidate@email.com"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input
                    type="tel"
                    value={form.candidatePhone}
                    onChange={f("candidatePhone")}
                    placeholder="+966 50 000 0000"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Job Role *</label>
                  <input
                    value={form.jobRole}
                    onChange={f("jobRole")}
                    placeholder="e.g. Senior AI Engineer"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Department</label>
                  <input
                    value={form.department}
                    onChange={f("department")}
                    placeholder="e.g. Technology"
                    className={inputCls}
                  />
                </div>

                {/* Interview Type */}
                <div className="col-span-2">
                  <label className={labelCls}>Interview Type *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Online", "On-Site", "Hybrid"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setForm({ ...form, interviewType: t })}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.interviewType === t ? "border-blue-400 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:border-blue-200"}`}
                      >
                        {t === "Online" ? (
                          <Video size={15} />
                        ) : t === "On-Site" ? (
                          <MapPin size={15} />
                        ) : (
                          <Layers size={15} />
                        )}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={f("date")}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Time *</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={f("time")}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Duration</label>
                  <select
                    value={form.duration}
                    onChange={f("duration")}
                    className={inputCls}
                  >
                    {[
                      "30 min",
                      "45 min",
                      "60 min",
                      "75 min",
                      "90 min",
                      "120 min",
                    ].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Interviewer *</label>
                  <input
                    value={form.interviewer}
                    onChange={f("interviewer")}
                    placeholder="e.g. Dr. Saleh Al-Ghamdi"
                    className={inputCls}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Interview Panel (optional)</label>
                  <input
                    value={form.panel}
                    onChange={f("panel")}
                    placeholder="e.g. Eng. Rami Nasser, Dr. Sara Khalid"
                    className={inputCls}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Notes / Instructions</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={f("notes")}
                    placeholder="Any specific topics or instructions for the interviewâ€¦"
                    className={inputCls + " resize-none"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Interview Details */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Online / Hybrid fields */}
              {(form.interviewType === "Online" ||
                form.interviewType === "Hybrid") && (
                <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/50 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Video size={16} className="text-blue-600" />
                    <h3 className="font-semibold text-blue-800">
                      Online Meeting Details
                    </h3>
                  </div>
                  <div>
                    <label className={labelCls}>Meeting Platform *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {MEETING_PLATFORMS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setForm({ ...form, platform: p.id })}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${form.platform === p.id ? "border-blue-400 bg-white text-blue-700 shadow-sm" : "border-slate-200 text-slate-500 hover:border-blue-200 bg-white"}`}
                        >
                          <p.icon
                            size={15}
                            style={{
                              color:
                                form.platform === p.id ? p.color : "#94a3b8",
                            }}
                          />
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Meeting URL *</label>
                    <div className="flex gap-2">
                      <input
                        value={form.meetingUrl}
                        onChange={f("meetingUrl")}
                        placeholder={`https://${form.platform === "Zoom" ? "zoom.us/j/" : form.platform === "Google Meet" ? "meet.google.com/" : form.platform === "Microsoft Teams" ? "teams.microsoft.com/l/meetup-join/" : ""}â€¦`}
                        className={inputCls + " flex-1"}
                      />
                      <button className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 whitespace-nowrap">
                        <Sparkles size={13} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Paste your {form.platform} meeting link here.
                    </p>
                  </div>
                </div>
              )}

              {/* On-Site / Hybrid fields */}
              {(form.interviewType === "On-Site" ||
                form.interviewType === "Hybrid") && (
                <div className="p-5 rounded-2xl border border-teal-100 bg-teal-50/50 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={16} className="text-teal-600" />
                    <h3 className="font-semibold text-teal-800">
                      On-Site Location Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={labelCls}>Office Location *</label>
                      <div className="flex items-center gap-2">
                        <Building2
                          size={14}
                          className="text-slate-400 flex-shrink-0"
                        />
                        <input
                          value={form.officeLocation}
                          onChange={f("officeLocation")}
                          placeholder="e.g. TalentFlow HQ, Riyadh"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Building Name</label>
                      <input
                        value={form.building}
                        onChange={f("building")}
                        placeholder="e.g. Innovation Tower"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Floor</label>
                      <input
                        value={form.floor}
                        onChange={f("floor")}
                        placeholder="e.g. 12th Floor"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Room Number</label>
                      <input
                        value={form.room}
                        onChange={f("room")}
                        placeholder="e.g. Conference Room B"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Google Maps Link</label>
                      <input
                        value={form.mapsLink}
                        onChange={f("mapsLink")}
                        placeholder="https://maps.google.com/â€¦"
                        className={inputCls}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Parking Instructions</label>
                      <textarea
                        rows={2}
                        value={form.parking}
                        onChange={f("parking")}
                        placeholder="e.g. Basement P2 â€“ Visitor parking. Mention TalentFlow at gate."
                        className={inputCls + " resize-none"}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Reception Information</label>
                      <textarea
                        rows={2}
                        value={form.reception}
                        onChange={f("reception")}
                        placeholder="e.g. Ask for Sara Al-Faris at reception. Bring valid ID."
                        className={inputCls + " resize-none"}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Email Preview */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-blue-600" />
                  <h3 className="font-semibold text-slate-800">
                    Auto-Generated Invitation Email
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyEmail}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${copied ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {copied ? (
                      <>
                        <Check size={12} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy
                      </>
                    )}
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    <Printer size={12} /> Print
                  </button>
                </div>
              </div>

              {/* Email envelope */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 w-14 flex-shrink-0 text-xs font-medium">
                      To:
                    </span>
                    <span className="text-slate-700">
                      {form.candidateEmail || "candidate@email.com"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 w-14 flex-shrink-0 text-xs font-medium">
                      From:
                    </span>
                    <span className="text-slate-700">hr@talentflow.ai</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-slate-400 w-14 flex-shrink-0 text-xs font-medium">
                      Subject:
                    </span>
                    <span className="text-slate-800 font-semibold">
                      Interview Invitation â€“ {form.jobRole || "[Job Role]"} at
                      TalentFlow
                    </span>
                  </div>
                </div>
                <div className="p-5 bg-white">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {emailText.split("\n").slice(2).join("\n")}
                  </pre>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
                <AlertCircle
                  size={14}
                  className="text-amber-600 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-amber-800">
                  Review the email carefully before sending. You can edit any
                  field in the previous steps and come back to refresh the
                  preview.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Confirm */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center py-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "#ECFDF5" }}
                >
                  <CalendarCheck size={30} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">
                  Ready to Schedule!
                </h3>
                <p className="text-slate-500 text-sm">
                  Review the summary below, then confirm to schedule the
                  interview.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                {[
                  { label: "Candidate", value: form.candidateName },
                  { label: "Email", value: form.candidateEmail },
                  { label: "Role", value: form.jobRole },
                  { label: "Type", value: form.interviewType },
                  {
                    label: "Date & Time",
                    value: `${form.date} at ${form.time}`,
                  },
                  { label: "Duration", value: form.duration },
                  { label: "Interviewer", value: form.interviewer },
                  ...(form.interviewType !== "On-Site"
                    ? [
                        { label: "Platform", value: form.platform },
                        { label: "Meeting URL", value: form.meetingUrl || "â€”" },
                      ]
                    : []),
                  ...(form.interviewType !== "Online"
                    ? [
                        {
                          label: "Location",
                          value: `${form.building}, ${form.room || "TBD"}`,
                        },
                      ]
                    : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-400 font-medium">{label}</span>
                    <span className="text-slate-800 font-semibold text-right max-w-[60%] truncate">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Schedule Only",
                    desc: "No email sent",
                    color: "#64748B",
                  },
                  {
                    label: "Schedule & Email",
                    desc: "Send invitation now",
                    color: "#0A4174",
                  },
                  {
                    label: "Schedule & Calendar",
                    desc: "Add to calendar",
                    color: "#7C3AED",
                  },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={handleSave}
                    disabled={saving}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-slate-200 text-center transition-all hover:border-blue-300 hover:shadow-md disabled:opacity-60"
                  >
                    <span
                      className="text-sm font-semibold"
                      style={{ color: opt.color }}
                    >
                      {opt.label}
                    </span>
                    <span className="text-xs text-slate-400">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
          <button
            onClick={() => (step > 1 ? setStep((s) => s - 1) : onClose())}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft size={15} /> {step === 1 ? "Cancel" : "Back"}
          </button>

          <div className="flex gap-2">
            {saving && (
              <Loader
                size={16}
                className="animate-spin text-blue-500 my-auto"
              />
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all"
                style={{
                  background: "linear-gradient(135deg, #001D39, #0A4174)",
                }}
              >
                Next <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #059669, #10B981)",
                }}
              >
                <CheckCircle size={15} /> Confirm Schedule
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ INTERVIEW DETAIL DRAWER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function InterviewDrawer({ interview, onClose, onStatusChange }) {
  const [tab, setTab] = useState("details");
  const safeInterview = { ...EMPTY_FORM, ...(interview || {}) };
  const candidateName = safeInterview.candidateName || "Candidate";
  const jobRole = safeInterview.jobRole || "Interview";
  const emailText = generateEmail(
    safeInterview,
    safeInterview.interviewType,
  );
  const cfg = STATUS_CONFIG[safeInterview.status] || STATUS_CONFIG.Scheduled || { color: "#0A4174" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end"
      style={{ background: "rgba(0,29,57,0.35)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-5 text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #001D39, #0A4174)" }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                {candidateName.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-lg">{candidateName}</h2>
                <p className="text-blue-200 text-sm">{jobRole}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <TypeBadge type={interview.interviewType} />
            <StatusBadge status={interview.status} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 flex-shrink-0">
          {[
            ["details", "Details"],
            ["email", "Email Preview"],
            ["portal", "Candidate Portal"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-3 text-xs font-semibold transition-colors ${tab === id ? "text-blue-700 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "details" && (
            <div className="space-y-4">
              {/* Date/Time */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Calendar, label: "Date", value: interview.date },
                  { icon: Clock, label: "Time", value: interview.time },
                  { icon: Clock, label: "Duration", value: interview.duration },
                  {
                    icon: User,
                    label: "Interviewer",
                    value: interview.interviewer,
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={12} className="text-blue-400" />
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

              {interview.panel && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users size={12} className="text-blue-400" />
                    <p className="text-xs text-slate-400 font-medium">
                      Interview Panel
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {interview.panel}
                  </p>
                </div>
              )}

              {/* Online details */}
              {(interview.interviewType === "Online" ||
                interview.interviewType === "Hybrid") &&
                interview.meetingUrl && (
                  <div className="p-4 rounded-xl border border-blue-100 bg-blue-50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Video size={14} className="text-blue-600" />
                      <p className="text-sm font-semibold text-blue-800">
                        Online Meeting
                      </p>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-auto">
                        {interview.platform}
                      </span>
                    </div>
                    <a
                      href={interview.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline break-all"
                    >
                      <Link2 size={11} /> {interview.meetingUrl}
                      <ExternalLink size={10} className="flex-shrink-0" />
                    </a>
                    <div className="flex gap-2 pt-1">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                        style={{ background: "#0A4174" }}
                      >
                        <ExternalLink size={11} /> Join Meeting
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200 text-blue-700 hover:bg-blue-100">
                        <Copy size={11} /> Copy Link
                      </button>
                    </div>
                  </div>
                )}

              {/* On-site details */}
              {(interview.interviewType === "On-Site" ||
                interview.interviewType === "Hybrid") &&
                interview.officeLocation && (
                  <div className="p-4 rounded-xl border border-teal-100 bg-teal-50 space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-teal-600" />
                      <p className="text-sm font-semibold text-teal-800">
                        On-Site Location
                      </p>
                    </div>
                    <div className="space-y-1 text-xs text-teal-800">
                      <p>
                        <span className="font-medium">Office:</span>{" "}
                        {interview.officeLocation}
                      </p>
                      {interview.building && (
                        <p>
                          <span className="font-medium">Building:</span>{" "}
                          {interview.building}
                        </p>
                      )}
                      {interview.floor && (
                        <p>
                          <span className="font-medium">Floor:</span>{" "}
                          {interview.floor}
                        </p>
                      )}
                      {interview.room && (
                        <p>
                          <span className="font-medium">Room:</span>{" "}
                          {interview.room}
                        </p>
                      )}
                    </div>
                    {interview.mapsLink && (
                      <a
                        href={interview.mapsLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-teal-700 hover:underline font-medium"
                      >
                        <Navigation2 size={11} /> Open in Google Maps
                      </a>
                    )}
                    {interview.parking && (
                      <div className="mt-2 pt-2 border-t border-teal-200">
                        <p className="text-xs font-semibold text-teal-700 flex items-center gap-1 mb-1">
                          <Car size={11} /> Parking
                        </p>
                        <p className="text-xs text-teal-700">
                          {interview.parking}
                        </p>
                      </div>
                    )}
                    {interview.reception && (
                      <div className="mt-2 pt-2 border-t border-teal-200">
                        <p className="text-xs font-semibold text-teal-700 flex items-center gap-1 mb-1">
                          <Building2 size={11} /> Reception
                        </p>
                        <p className="text-xs text-teal-700">
                          {interview.reception}
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {interview.notes && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs font-semibold text-amber-700 mb-1">
                    Notes
                  </p>
                  <p className="text-xs text-amber-800">{interview.notes}</p>
                </div>
              )}

              {interview.rescheduleReason && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-xs font-semibold text-red-700 mb-1">
                    Reschedule Reason
                  </p>
                  <p className="text-xs text-red-700">
                    {interview.rescheduleReason}
                  </p>
                </div>
              )}

              {/* Status update */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Update Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Invitation Sent",
                    "Confirmed",
                    "Completed",
                    "Rescheduled",
                    "No Show",
                    "Cancelled",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => onStatusChange(interview.id, s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${interview.status === s ? "text-white border-transparent" : "border-slate-200 text-slate-600 hover:border-blue-200"}`}
                      style={
                        interview.status === s
                          ? { background: STATUS_CONFIG[s].color }
                          : {}
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "email" && (
            <div className="space-y-3">
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 text-xs w-12">To:</span>
                    <span className="text-slate-700">
                      {interview.candidateEmail}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-slate-400 text-xs w-12">
                      Subject:
                    </span>
                    <span className="text-slate-800 font-semibold text-xs">
                      Interview Invitation â€“ {interview.jobRole} at TalentFlow
                    </span>
                  </div>
                </div>
                <div className="p-4 max-h-80 overflow-y-auto">
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {emailText.split("\n").slice(2).join("\n")}
                  </pre>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #001D39, #0A4174)",
                  }}
                  onClick={() =>
                    onStatusChange(interview.id, "Invitation Sent")
                  }
                >
                  <Send size={14} /> Send to Candidate
                </button>
                <button className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm">
                  <Download size={14} />
                </button>
              </div>
            </div>
          )}

          {tab === "portal" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 text-center">
                <Star size={24} className="mx-auto mb-2 text-blue-400" />
                <p className="text-sm font-semibold text-slate-700">
                  Candidate Portal View
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  What {interview.candidateName} sees
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{
                      background: "linear-gradient(135deg, #001D39, #0A4174)",
                    }}
                  >
                    TF
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      TalentFlow HR
                    </p>
                    <p className="text-xs text-slate-400">
                      Interview Invitation
                    </p>
                  </div>
                  <StatusBadge status={interview.status} />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800 mb-3">
                    Your Interview Details
                  </p>
                  {[
                    {
                      icon: Briefcase,
                      label: "Position",
                      value: interview.jobRole,
                    },
                    { icon: Calendar, label: "Date", value: interview.date },
                    {
                      icon: Clock,
                      label: "Time",
                      value: `${interview.time} Â· ${interview.duration}`,
                    },
                    { icon: User, label: "With", value: interview.interviewer },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0"
                    >
                      <Icon size={14} className="text-blue-400 flex-shrink-0" />
                      <span className="text-xs text-slate-400 w-16">
                        {label}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {interview.meetingUrl && (
                  <button
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-semibold"
                    style={{
                      background: "linear-gradient(135deg, #2D8CFF, #0A4174)",
                    }}
                  >
                    <Video size={13} /> Join {interview.platform} Meeting
                  </button>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <button className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 transition-colors">
                    <CheckCircle size={14} className="text-emerald-500" />{" "}
                    Confirm
                  </button>
                  <button className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 transition-colors">
                    <RefreshCw size={14} className="text-amber-500" />{" "}
                    Reschedule
                  </button>
                  <button className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 transition-colors">
                    <Download size={14} className="text-blue-500" /> Calendar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const INITIAL_NOTIFS = [];
const NOTIF_STYLE = {
  confirm: { icon: CheckCircle, color: "#059669", bg: "#ECFDF5" },
  schedule: { icon: Calendar, color: "#0A4174", bg: "#EFF6FF" },
  reschedule: { icon: RefreshCw, color: "#D97706", bg: "#FFFBEB" },
  reminder: { icon: Bell, color: "#7C3AED", bg: "#F5F3FF" },
  sent: { icon: Send, color: "#0891B2", bg: "#ECFEFF" },
  noshow: { icon: AlertCircle, color: "#DC2626", bg: "#FEF2F2" },
};

// â”€â”€â”€ MAIN PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Map the backend /hr/interviews shape to the shape this page renders.
function mapApiInterview(i) {
  const rawType = (i.type || "").toLowerCase();
  const interviewType = rawType.includes("site") || rawType.includes("onsite")
    ? "On-Site"
    : rawType.includes("hybrid")
      ? "Hybrid"
      : "Online";
  const loc = i.location || "";
  const isUrl = /^https?:\/\//i.test(loc);
  return {
    id: i.id,
    candidateName: i.candidateName || "â€”",
    candidateEmail: i.candidateEmail || "",
    candidatePhone: "",
    jobRole: i.roleTitle || "",
    department: "",
    interviewType,
    date: i.date || "",
    time: i.time || "",
    duration: "60 min",
    interviewer: "",
    panel: "",
    notes: i.notes || "",
    status: i.status || "Scheduled",
    platform: isUrl ? "Custom Link" : "",
    meetingUrl: isUrl ? loc : "",
    officeLocation: !isUrl ? loc : "",
    invitationSent: i.status === "Invitation Sent",
    createdAt: i.date || "",
  };
}

export default function InterviewScheduler() {
  const [tab, setTab] = useState("overview");
  // Live interviews from SQLite (no mock data â€” Issue 4).
  const [interviews, setInterviews] = useState([]);

  function loadInterviews() {
    interviewsApi.hrList()
      .then((data) => setInterviews(Array.isArray(data) ? data.map(mapApiInterview) : []))
      .catch(() => setInterviews([]));
  }
  useEffect(() => { loadInterviews(); }, []);
  const [showModal, setShowModal] = useState(false);
  const [viewedInterview, setViewedInterview] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [toast, setToast] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  function showToast(msg, color = "#059669") {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  }

  function handleStatusChange(id, status) {
    setInterviews((prev) =>
      prev.map((iv) =>
        iv.id === id
          ? {
              ...iv,
              status,
              invitationSent:
                status === "Invitation Sent" ? true : iv.invitationSent,
            }
          : iv,
      ),
    );
    // Persist the status change to SQLite (ids are real backend interview ids).
    interviewsApi.update(id, { status }).catch(() => {});
    const iv = interviews.find((i) => i.id === id);
    const toastMessages = {
      "Invitation Sent": `âœ“ Invitation sent to ${iv?.candidateName}`,
      Confirmed: `âœ“ ${iv?.candidateName} marked as Confirmed`,
      Completed: `âœ“ Interview with ${iv?.candidateName} marked as Completed`,
      Cancelled: `Interview with ${iv?.candidateName} cancelled`,
    };
    showToast(
      toastMessages[status] || `Status updated to ${status}`,
      status === "Cancelled" ? "#DC2626" : "#059669",
    );
    if (viewedInterview?.id === id)
      setViewedInterview((prev) => (prev ? { ...prev, status } : null));
  }

  function handleAddInterview(iv) {
    setInterviews((prev) => [iv, ...prev]);
    setShowModal(false);
    setTab("overview");
    showToast(`âœ“ Interview scheduled for ${iv.candidateName}`);
    const newNotif = {
      id: `n${Date.now()}`,
      type: "schedule",
      msg: `New interview scheduled: ${iv.candidateName} â€“ ${iv.jobRole} on ${iv.date}`,
      time: "Just now",
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }

  const todayInterviews = interviews.filter((iv) => iv.date === today);
  const upcomingInterviews = interviews.filter(
    (iv) =>
      iv.date > today &&
      ["Scheduled", "Confirmed", "Invitation Sent"].includes(iv.status),
  );
  const pendingConf = interviews.filter(
    (iv) => iv.status === "Scheduled" || iv.status === "Invitation Sent",
  );
  const rescheduleReq = interviews.filter((iv) => iv.status === "Rescheduled");
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const filteredInterviews = interviews.filter((iv) => {
    const matchStatus = filterStatus === "All" || iv.status === filterStatus;
    const matchSearch =
      iv.candidateName.toLowerCase().includes(searchQ.toLowerCase()) ||
      iv.jobRole.toLowerCase().includes(searchQ.toLowerCase());
    return matchStatus && matchSearch;
  });

  // â”€â”€â”€ RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="space-y-5 pb-10">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl"
          style={{ background: toast.color, minWidth: 280 }}
        >
          <CheckCircle size={16} /> {toast.msg}
        </div>
      )}

      {/* Notification drawer */}
      {showNotifPanel && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifPanel(false)}
        >
          <div
            className="absolute right-4 top-20 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-slate-100"
              style={{
                background: "linear-gradient(135deg, #001D39, #0A4174)",
              }}
            >
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-white" />
                <span className="font-semibold text-white">Notifications</span>
                {unreadNotifs > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                    {unreadNotifs}
                  </span>
                )}
              </div>
              <button
                onClick={() =>
                  setNotifications((n) => n.map((x) => ({ ...x, read: true })))
                }
                className="text-xs text-blue-200 hover:text-white"
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((n) => {
                const cfg = NOTIF_STYLE[n.type] || NOTIF_STYLE.schedule;
                const Icon = cfg.icon;
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? "bg-blue-50/50" : ""}`}
                    onClick={() =>
                      setNotifications((prev) =>
                        prev.map((x) =>
                          x.id === n.id ? { ...x, read: true } : x,
                        ),
                      )
                    }
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.bg }}
                    >
                      <Icon size={14} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs leading-snug ${!n.read ? "font-semibold text-slate-800" : "text-slate-600"}`}
                      >
                        {n.msg}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ PAGE HEADER â”€â”€ */}
      <div
        className="rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{
          background:
            "linear-gradient(135deg, #001D39 0%, #0A4174 55%, #49769F 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/15">
            <CalendarCheck size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Interview Scheduling
            </h1>
            <p className="text-blue-200 text-sm">
              Schedule, invite, and track all candidate interviews
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNotifPanel(!showNotifPanel)}
            className="relative p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
          >
            <Bell size={18} />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {unreadNotifs}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow-md hover:opacity-90 transition-all bg-white/20 border border-white/30 hover:bg-white/30"
          >
            <Plus size={16} /> Schedule Interview
          </button>
        </div>
      </div>

      {/* â”€â”€ KPI CARDS â”€â”€ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Today's Interviews"
          value={todayInterviews.length || 2}
          icon={Calendar}
          color="#0A4174"
          bg="#EFF6FF"
          sublabel="June 10, 2026"
        />
        <KpiCard
          label="Upcoming Interviews"
          value={upcomingInterviews.length}
          icon={CalendarCheck}
          color="#059669"
          bg="#ECFDF5"
          sublabel="Next 7 days"
        />
        <KpiCard
          label="Pending Confirmations"
          value={pendingConf.length}
          icon={Clock}
          color="#D97706"
          bg="#FFFBEB"
          sublabel="Awaiting response"
        />
        <KpiCard
          label="Reschedule Requests"
          value={rescheduleReq.length}
          icon={RefreshCw}
          color="#DC2626"
          bg="#FEF2F2"
          sublabel="Needs attention"
        />
      </div>

      {/* â”€â”€ TABS â”€â”€ */}
      <div className="flex bg-white border border-slate-100 rounded-2xl p-1 gap-1 shadow-sm">
        {[
          ["overview", "Overview", CalendarCheck],
          ["all", "All Interviews", Calendar],
          ["portal", "Candidate Portal", Users],
          ["notifications", "Notifications", Bell],
        ].map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 flex-1 justify-center py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === id ? "text-white shadow-md" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
            style={
              tab === id
                ? { background: "linear-gradient(135deg, #001D39, #0A4174)" }
                : {}
            }
          >
            <Icon size={15} /> <span className="hidden sm:inline">{label}</span>
            {id === "notifications" && unreadNotifs > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {unreadNotifs}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* â•â• OVERVIEW TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Today */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div
              className="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
              style={{ background: "#EFF6FF" }}
            >
              <Calendar size={16} style={{ color: "#0A4174" }} />
              <h2 className="font-semibold text-sm text-slate-800">
                Today's Interviews
              </h2>
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {todayInterviews.length || 2}
              </span>
            </div>
            <div className="p-4 space-y-3">
              {[
                ...todayInterviews,
                ...interviews.slice(0, Math.max(0, 2 - todayInterviews.length)),
              ]
                .slice(0, 3)
                .map((iv) => (
                  <div
                    key={iv.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer"
                    onClick={() => setViewedInterview(iv)}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #001D39, #0A4174)",
                      }}
                    >
                      {iv.candidateName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {iv.candidateName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {iv.jobRole}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-blue-700">
                        {iv.time}
                      </p>
                      <StatusBadge status={iv.status} />
                    </div>
                  </div>
                ))}
              {todayInterviews.length === 0 && (
                <div className="py-6 text-center text-slate-400">
                  <Calendar size={28} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-sm">No interviews scheduled today</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div
              className="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
              style={{ background: "#ECFDF5" }}
            >
              <CalendarCheck size={16} style={{ color: "#059669" }} />
              <h2 className="font-semibold text-sm text-slate-800">
                Upcoming Interviews
              </h2>
              <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                {upcomingInterviews.length}
              </span>
            </div>
            <div className="p-4 space-y-3">
              {upcomingInterviews.slice(0, 4).map((iv) => (
                <div
                  key={iv.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all cursor-pointer"
                  onClick={() => setViewedInterview(iv)}
                >
                  <div className="flex-shrink-0 text-center w-10">
                    <p className="text-lg font-bold text-emerald-700 leading-none">
                      {iv.date.split("-")[2]}
                    </p>
                    <p className="text-xs text-emerald-500">
                      {new Date(iv.date + "T00:00:00").toLocaleString("en", {
                        month: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {iv.candidateName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {iv.jobRole} Â· {iv.time}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <TypeBadge type={iv.interviewType} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Confirmations */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div
              className="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
              style={{ background: "#FFFBEB" }}
            >
              <Clock size={16} style={{ color: "#D97706" }} />
              <h2 className="font-semibold text-sm text-slate-800">
                Pending Confirmations
              </h2>
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {pendingConf.length}
              </span>
            </div>
            <div className="p-4 space-y-3">
              {pendingConf.map((iv) => (
                <div
                  key={iv.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-amber-100 hover:bg-amber-50 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {iv.candidateName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {iv.date} Â· {iv.time}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStatusChange(iv.id, "Invitation Sent")}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90"
                    style={{ background: "#7C3AED" }}
                  >
                    <Send size={10} /> Send
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Reschedule Requests */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div
              className="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
              style={{ background: "#FEF2F2" }}
            >
              <RefreshCw size={16} style={{ color: "#DC2626" }} />
              <h2 className="font-semibold text-sm text-slate-800">
                Reschedule Requests
              </h2>
              <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                {rescheduleReq.length}
              </span>
            </div>
            <div className="p-4 space-y-3">
              {rescheduleReq.map((iv) => (
                <div
                  key={iv.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-red-100 hover:bg-red-50 transition-all"
                >
                  <AlertCircle
                    size={14}
                    className="text-red-400 mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {iv.candidateName}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {iv.rescheduleReason}
                    </p>
                  </div>
                  <button
                    onClick={() => setViewedInterview(iv)}
                    className="text-xs text-red-600 font-semibold hover:underline flex-shrink-0"
                  >
                    Resolve
                  </button>
                </div>
              ))}
              {rescheduleReq.length === 0 && (
                <div className="py-6 text-center text-slate-400">
                  <CheckCircle
                    size={28}
                    className="mx-auto mb-2 text-slate-200"
                  />
                  <p className="text-sm">No reschedule requests</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* â•â• ALL INTERVIEWS TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {tab === "all" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-52">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search candidate or roleâ€¦"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                "All",
                "Scheduled",
                "Invitation Sent",
                "Confirmed",
                "Rescheduled",
                "Completed",
                "No Show",
                "Cancelled",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filterStatus === s ? "text-white border-transparent" : "border-slate-200 text-slate-600 hover:border-blue-200 bg-white"}`}
                  style={
                    filterStatus === s
                      ? {
                          background:
                            "linear-gradient(135deg, #001D39, #0A4174)",
                        }
                      : {}
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredInterviews.map((iv) => (
              <InterviewCard
                key={iv.id}
                interview={iv}
                onStatusChange={handleStatusChange}
                onView={setViewedInterview}
              />
            ))}
          </div>

          {filteredInterviews.length === 0 && (
            <div className="py-16 text-center bg-white border border-slate-100 rounded-2xl">
              <Calendar size={36} className="mx-auto mb-3 text-slate-200" />
              <p className="text-slate-500 font-medium">
                No interviews match your filters
              </p>
            </div>
          )}
        </div>
      )}

      {/* â•â• CANDIDATE PORTAL TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {tab === "portal" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 flex items-center gap-4">
            <Users size={24} className="text-blue-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">
                Candidate Portal Preview
              </p>
              <p className="text-sm text-slate-500">
                This is how candidates see their interview invitations. Click
                any card to see the full portal view.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {interviews
              .filter((iv) => iv.invitationSent)
              .map((iv) => (
                <div
                  key={iv.id}
                  className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => setViewedInterview(iv)}
                >
                  <div
                    className="px-5 py-4 flex items-center gap-3"
                    style={{
                      background: "linear-gradient(135deg, #001D39, #0A4174)",
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white bg-white/15">
                      {iv.candidateName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">
                        {iv.candidateName}
                      </p>
                      <p className="text-blue-200 text-xs truncate">
                        {iv.jobRole}
                      </p>
                    </div>
                    <StatusBadge status={iv.status} />
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: Calendar, v: iv.date },
                        { icon: Clock, v: `${iv.time} Â· ${iv.duration}` },
                      ].map(({ icon: Icon, v }, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm text-slate-600"
                        >
                          <Icon
                            size={13}
                            className="text-slate-400 flex-shrink-0"
                          />
                          <span className="truncate text-xs">{v}</span>
                        </div>
                      ))}
                    </div>

                    {iv.meetingUrl && (
                      <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-xl">
                        <Video
                          size={13}
                          className="text-blue-500 flex-shrink-0"
                        />
                        <span className="text-xs text-blue-700 font-medium">
                          {iv.platform}
                        </span>
                        <ExternalLink
                          size={11}
                          className="ml-auto text-blue-400"
                        />
                      </div>
                    )}
                    {iv.officeLocation && (
                      <div className="flex items-center gap-2 p-2.5 bg-teal-50 rounded-xl">
                        <MapPin
                          size={13}
                          className="text-teal-500 flex-shrink-0"
                        />
                        <span className="text-xs text-teal-700 font-medium truncate">
                          {iv.building}, {iv.room}
                        </span>
                        <Navigation2
                          size={11}
                          className="ml-auto text-teal-400 flex-shrink-0"
                        />
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white"
                        style={{ background: "#059669" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(iv.id, "Confirmed");
                        }}
                      >
                        <CheckCircle size={12} /> Confirm
                      </button>
                      <button
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(iv.id, "Rescheduled");
                        }}
                      >
                        <RefreshCw size={12} /> Reschedule
                      </button>
                      <button
                        className="px-3 py-2 rounded-xl text-xs border border-slate-200 text-slate-500 hover:bg-slate-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* â•â• NOTIFICATIONS TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {tab === "notifications" && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div
            className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg, #001D39, #0A4174)" }}
          >
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-white" />
              <h2 className="font-semibold text-white">All Notifications</h2>
              {unreadNotifs > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                  {unreadNotifs} new
                </span>
              )}
            </div>
            <button
              onClick={() =>
                setNotifications((n) => n.map((x) => ({ ...x, read: true })))
              }
              className="text-xs text-blue-200 hover:text-white font-medium"
            >
              Mark all read
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {notifications.map((n) => {
              const cfg = NOTIF_STYLE[n.type] || NOTIF_STYLE.schedule;
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className={`flex gap-4 px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? "bg-blue-50/30" : ""}`}
                  onClick={() =>
                    setNotifications((prev) =>
                      prev.map((x) =>
                        x.id === n.id ? { ...x, read: true } : x,
                      ),
                    )
                  }
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg }}
                  >
                    <Icon size={18} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${!n.read ? "font-semibold text-slate-800" : "text-slate-600"}`}
                    >
                      {n.msg}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* â•â• MODALS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {showModal && (
        <ScheduleModal
          onClose={() => setShowModal(false)}
          onSave={handleAddInterview}
        />
      )}

      {viewedInterview && (
        <InterviewDrawer
          interview={viewedInterview}
          onClose={() => setViewedInterview(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}


