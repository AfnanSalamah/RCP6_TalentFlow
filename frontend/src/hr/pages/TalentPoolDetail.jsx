import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Globe,
  Star,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  DollarSign,
  Plane,
  BookOpen,
  Award,
  ChevronRight,
} from "lucide-react";
import { candidates, interviews, roles } from "../data/mockData";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { StarRating } from "../components/ui/StarRating";

const AVATAR_PALETTE = [
  ["#0A4174", "#BDD8E9"],
  ["#4E8EA2", "#EFF6FF"],
  ["#001D39", "#7BBDE8"],
  ["#49769F", "#E0F2FE"],
  ["#6EA2B3", "#DBEAFE"],
];
function avatarStyle(id) {
  return AVATAR_PALETTE[parseInt(id, 10) % AVATAR_PALETTE.length];
}

const HISTORY_TIMELINE = [
  { stage: "Applied", done: true },
  { stage: "Resume Reviewed", done: true },
  { stage: "Shortlisted", done: true },
  { stage: "Interviewed", done: true },
  { stage: "Added to Talent Pool", done: true },
];

export default function TalentPoolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reused, setReused] = useState(false);

  const candidate = candidates.find((c) => c.id === id);
  const candidateInterview = interviews.find((iv) => iv.candidateId === id);
  const candidateRole = roles.find((r) => r.id === candidate?.roleId);

  if (!candidate) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-slate-500 text-lg">Candidate not found.</p>
        <button
          onClick={() => navigate("/hr/talent-pool")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm"
          style={{ background: "linear-gradient(135deg, #0A4174, #4E8EA2)" }}
        >
          <ArrowLeft size={15} /> Back to Talent Pool
        </button>
      </div>
    );
  }

  const [bg, text] = avatarStyle(candidate.id);

  return (
    <div className="space-y-6 pb-10">
      {/* Back */}
      <button
        onClick={() => navigate("/hr/talent-pool")}
        className="flex items-center gap-2 text-sm font-medium transition-colors"
        style={{ color: "#49769F" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#0A4174")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#49769F")}
      >
        <ArrowLeft size={15} /> Back to Talent Pool
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
              backdropFilter: "blur(8px)",
            }}
          >
            {candidate.name.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{candidate.name}</h1>
              <Badge label={candidate.status} />
            </div>
            <p className="text-blue-200 font-medium">
              {candidateRole?.title ?? "Talent Pool Candidate"}
            </p>
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

          {/* Rating bubble */}
          <div className="flex-shrink-0 text-center bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
            <p className="text-xs text-blue-200 mb-1">Candidate Rating</p>
            <StarRating rating={candidate.rating} />
            <p className="text-xs text-blue-200 mt-1">
              {candidate.rating}/5 stars
            </p>
          </div>
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

      {/* ── History Timeline ── */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Candidate Journey
          </h2>
          <div className="flex items-start">
            {HISTORY_TIMELINE.map((step, i) => (
              <div key={step.stage} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: step.done ? "#4E8EA2" : "#E2E8F0" }}
                  >
                    <CheckCircle size={14} className="text-white" />
                  </div>
                  <span className="text-xs text-center leading-tight font-medium text-teal-700">
                    {step.stage}
                  </span>
                </div>
                {i < HISTORY_TIMELINE.length - 1 && (
                  <div className="h-0.5 flex-1 mx-1 rounded-full bg-teal-300" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col */}
        <div className="lg:col-span-2 space-y-5">
          {/* Profile Details */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-800">
                Candidate Information
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { icon: Mail, label: "Email", value: candidate.email },
                  { icon: Phone, label: "Phone", value: candidate.phone },
                  {
                    icon: MapPin,
                    label: "Location",
                    value: candidate.location,
                  },
                  {
                    icon: Briefcase,
                    label: "Experience",
                    value: candidate.experience,
                  },
                  {
                    icon: Clock,
                    label: "Availability",
                    value: candidate.availability,
                  },
                  {
                    icon: Plane,
                    label: "Travel Willingness",
                    value: candidate.travelWillingness,
                  },
                  {
                    icon: DollarSign,
                    label: "Expected Rate",
                    value: candidate.compensation,
                  },
                  {
                    icon: Globe,
                    label: "Languages",
                    value: candidate.languages.join(", "),
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={13} className="text-blue-400" />
                      <p className="text-xs text-slate-400 font-medium">
                        {label}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 break-words">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skills & Languages */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award size={16} className="text-blue-500" />
                <h2 className="font-semibold text-slate-800">
                  Skills & Expertise
                </h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Technical Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-100"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Languages
                </p>
                <div className="flex flex-wrap gap-2">
                  {candidate.languages.map((l) => (
                    <span
                      key={l}
                      className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-xl text-sm font-medium border border-teal-100"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview History */}
          {candidateInterview && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-blue-500" />
                  <h2 className="font-semibold text-slate-800">
                    Interview History
                  </h2>
                </div>
                <button
                  onClick={() => navigate(`/hr/interviews/${candidate.id}`)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  View full details <ChevronRight size={13} />
                </button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 p-4 bg-slate-50 rounded-2xl space-y-2">
                    {[
                      { label: "Role", value: candidateInterview.roleTitle },
                      {
                        label: "Interviewer",
                        value: candidateInterview.interviewer,
                      },
                      { label: "Date", value: candidateInterview.date },
                      { label: "Status", value: candidateInterview.status },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-slate-400">{label}</span>
                        <span className="font-medium text-slate-700">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                  {candidateInterview.recommendation !== "Pending" && (
                    <div
                      className="sm:w-48 p-4 rounded-2xl text-center border-2"
                      style={{ borderColor: "#BDD8E9", background: "#EFF6FF" }}
                    >
                      <p className="text-xs text-slate-400 mb-2">
                        Recommendation
                      </p>
                      <p className="text-lg font-bold text-blue-700">
                        {candidateInterview.recommendation}
                      </p>
                      <div className="mt-2 flex justify-center">
                        <StarRating rating={candidateInterview.rating} />
                      </div>
                    </div>
                  )}
                </div>
                {candidateInterview.strengths && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800">
                    <span className="font-semibold">Strengths: </span>
                    {candidateInterview.strengths}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Previous Projects */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-800">
                Previous Projects
              </h2>
            </CardHeader>
            <CardContent>
              {candidateRole ? (
                <div
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 transition-colors group"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#EFF6FF")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  onClick={() => navigate(`/hr/roles/${candidateRole.id}`)}
                >
                  <div>
                    <p className="font-medium text-slate-800 group-hover:text-blue-700 transition-colors">
                      {candidateRole.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {candidateRole.location} · {candidateRole.contractType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={candidateRole.status} />
                    <ChevronRight
                      size={15}
                      className="text-slate-300 group-hover:text-blue-400"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-4 text-center">
                  No previous project records found.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Candidate card */}
          <Card>
            <CardContent className="py-5 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-3"
                style={{ background: bg, color: text }}
              >
                {candidate.name.charAt(0)}
              </div>
              <p className="font-bold text-slate-800">{candidate.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {candidate.experience} experience
              </p>
              <div className="flex justify-center mt-2">
                <StarRating rating={candidate.rating} />
              </div>
              <div className="mt-3">
                <Badge label={candidate.status} />
              </div>
              <button
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-medium shadow-md hover:opacity-90 transition-all"
                style={{
                  background: "linear-gradient(135deg, #0A4174, #4E8EA2)",
                }}
              >
                <Download size={14} /> Download Resume
              </button>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-blue-500" />
                <h2 className="font-semibold text-slate-800">Availability</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Start Date", value: candidate.availability },
                { label: "Travel", value: candidate.travelWillingness },
                { label: "Expected Rate", value: candidate.compensation },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0"
                >
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Rating breakdown */}
          {candidateInterview && candidateInterview.technicalSkills > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star size={15} className="text-amber-400 fill-amber-400" />
                  <h2 className="font-semibold text-slate-800">
                    Evaluation Scores
                  </h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    label: "Technical Skills",
                    value: candidateInterview.technicalSkills,
                  },
                  {
                    label: "Communication",
                    value: candidateInterview.communication,
                  },
                  {
                    label: "Domain Expertise",
                    value: candidateInterview.domainExpertise,
                  },
                  {
                    label: "Availability",
                    value: candidateInterview.availability,
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{label}</span>
                      <span className="font-semibold">{value}/5</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(value / 5) * 100}%`,
                          background:
                            value >= 4
                              ? "#059669"
                              : value >= 3
                                ? "#4E8EA2"
                                : "#D97706",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Reuse panel */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <RefreshCw size={15} className="text-blue-500" />
                <h2 className="font-semibold text-slate-800">
                  Reuse Candidate
                </h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                Add this candidate back to the active hiring pipeline for a new
                role or project.
              </p>
              {reused ? (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle
                    size={16}
                    className="text-emerald-600 flex-shrink-0"
                  />
                  <p className="text-sm font-medium text-emerald-700">
                    Added to Active Pool
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setReused(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all"
                  style={{
                    background: "linear-gradient(135deg, #4E8EA2, #0A4174)",
                  }}
                >
                  <RefreshCw size={14} /> Reuse for New Role
                </button>
              )}
              <button
                onClick={() => navigate("/hr/roles")}
                className="w-full py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Browse Open Roles
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
