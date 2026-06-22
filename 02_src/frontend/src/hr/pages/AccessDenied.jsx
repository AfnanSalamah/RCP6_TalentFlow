import { useNavigate } from "react-router-dom";
import { ShieldOff, ArrowLeft, LayoutDashboard } from "lucide-react";
import { usePermissions } from "../rbac/usePermissions";
import { ROLE_LABELS, ROLE_COLORS } from "../rbac/rbacConfig";

export default function AccessDenied() {
  const navigate      = useNavigate();
  const { hrRole }    = usePermissions();

  const roleLabel = ROLE_LABELS[hrRole] ?? "Unknown";
  const roleColor = ROLE_COLORS[hrRole] ?? ROLE_COLORS.interviewer;

  return (
    <div className="min-h-[calc(100vh-88px)] flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">

        {/* ── Icon blob ── */}
        <div className="flex justify-center mb-8">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg,#FEF2F2,#FEE2E2)" }}
          >
            <ShieldOff size={44} className="text-red-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* ── Error code ── */}
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-red-400 mb-2">
          Error 403
        </p>

        {/* ── Heading ── */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#001D39] mb-4 leading-tight">
          Access Denied
        </h1>

        {/* ── Message ── */}
        <p className="text-slate-500 text-base leading-relaxed mb-6 max-w-sm mx-auto">
          You do not have permission to access this page. This area requires
          elevated privileges beyond your current role.
        </p>

        {/* ── Current role badge ── */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-sm text-slate-400">Your role:</span>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full border"
            style={{
              background: roleColor.bg,
              color:      roleColor.text,
              borderColor: roleColor.border,
            }}
          >
            {roleLabel}
          </span>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/hr/dashboard")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg,#001D39,#0A4174)" }}
          >
            <LayoutDashboard size={16} />
            Back to Dashboard
          </button>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-[#0A4174] bg-[#EAF6FC] hover:bg-[#DFF1FA] border border-[#BDD8E9] transition-colors"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        {/* ── Help note ── */}
        <p className="mt-8 text-xs text-slate-400">
          Need access? Contact your system administrator to request the appropriate permissions.
        </p>

      </div>
    </div>
  );
}
