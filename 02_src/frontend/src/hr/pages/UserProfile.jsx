import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  User, Mail, Phone, MapPin, Briefcase, Building2, FileText,
  Shield, Bell, Activity, Camera, Save, Eye, EyeOff,
  Lock, Smartphone, Monitor, LogOut, Check, X, AlertTriangle,
  ChevronRight, Clock, Edit3, Hash, Calendar, Info,
  CheckCircle, XCircle, Wifi, Key,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../rbac/usePermissions";
import { ROLE_LABELS, ROLE_COLORS } from "../rbac/rbacConfig";
import { DEPARTMENTS } from "../data/usersData";

// ── Shared helpers ────────────────────────────────────────────────────────────
const TABS = [
  { id: "personal",      label: "Personal Info",          icon: User      },
  { id: "account",       label: "Account Info",           icon: Shield    },
  { id: "security",      label: "Security",               icon: Lock      },
  { id: "notifications", label: "Notifications",          icon: Bell      },
  { id: "activity",      label: "Activity History",       icon: Activity  },
];

function inputCls(err) {
  return `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all bg-white ${
    err
      ? "border-red-300 focus:ring-red-200 text-red-700"
      : "border-slate-200 focus:ring-blue-200 focus:border-blue-400 text-slate-800"
  }`;
}

function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-blue-500" : "bg-slate-200"}`}
    >
      <span
        className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 transition-transform duration-200 ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success: { bg: "#ECFDF5", border: "#A7F3D0", text: "#065F46", icon: CheckCircle, iconColor: "#10B981" },
    error:   { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", icon: XCircle,     iconColor: "#EF4444" },
    info:    { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF", icon: Info,         iconColor: "#3B82F6" },
  };
  const s = styles[type];
  const Icon = s.icon;

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-in slide-in-from-bottom-2"
      style={{ background: s.bg, borderColor: s.border }}
    >
      <Icon size={18} style={{ color: s.iconColor, flexShrink: 0 }} />
      <p className="text-sm font-semibold" style={{ color: s.text }}>{message}</p>
      <button onClick={onClose} className="ml-2" style={{ color: s.text }}>
        <X size={14} />
      </button>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ title, message, onConfirm, onCancel, danger = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,29,57,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? "bg-red-50" : "bg-amber-50"}`}>
          <AlertTriangle size={26} className={danger ? "text-red-500" : "text-amber-500"} />
        </div>
        <h3 className="font-bold text-slate-800 text-lg mb-2">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 ${danger ? "bg-red-600" : "bg-amber-500"}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mock activity data ────────────────────────────────────────────────────────
const MOCK_ACTIVITY = [
  { id: 1,  action: "Updated candidate profile",         target: "Ahmed Al-Rashidi",         date: "2026-06-07", time: "10:42 AM", icon: User,      color: "#3B82F6" },
  { id: 2,  action: "Submitted interview evaluation",    target: "Senior AI Engineer role",  date: "2026-06-07", time: "09:15 AM", icon: FileText,  color: "#059669" },
  { id: 3,  action: "Created job posting",               target: "FinTech Product Manager",  date: "2026-06-06", time: "03:30 PM", icon: Briefcase, color: "#7C3AED" },
  { id: 4,  action: "Sent offer letter",                 target: "Amira Khalil",             date: "2026-06-06", time: "11:05 AM", icon: Mail,      color: "#F59E0B" },
  { id: 5,  action: "Updated notification settings",     target: "Own profile",              date: "2026-06-05", time: "04:20 PM", icon: Bell,      color: "#0891B2" },
  { id: 6,  action: "Scheduled interview",               target: "Dana Khoury",              date: "2026-06-05", time: "01:47 PM", icon: Calendar,  color: "#EC4899" },
  { id: 7,  action: "Added candidate to Talent Pool",    target: "Joud Al-Aqeel",            date: "2026-06-04", time: "11:30 AM", icon: User,      color: "#3B82F6" },
  { id: 8,  action: "Reviewed resume",                   target: "Mohammad Al-Farsi",        date: "2026-06-04", time: "10:00 AM", icon: FileText,  color: "#059669" },
  { id: 9,  action: "Updated system settings",           target: "Notification config",      date: "2026-06-03", time: "05:15 PM", icon: Shield,    color: "#DC2626" },
  { id: 10, action: "Logged in",                         target: "Session started",          date: "2026-06-03", time: "08:55 AM", icon: Wifi,      color: "#64748B" },
];

// ── Mock sessions ─────────────────────────────────────────────────────────────
const MOCK_SESSIONS = [
  { id: "s1", device: "Chrome on Windows 11",  location: "Riyadh, SA",   lastActive: "Active now",   current: true  },
  { id: "s2", device: "Safari on iPhone 15",   location: "Riyadh, SA",   lastActive: "2 hours ago",  current: false },
  { id: "s3", device: "Firefox on macOS",      location: "Jeddah, SA",   lastActive: "1 day ago",    current: false },
];

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function UserProfile() {
  const { user, login }  = useAuth();
  const { hrRole, can }  = usePermissions();
  const navigate         = useNavigate();
  const [searchParams]   = useSearchParams();
  const fileInputRef     = useRef(null);

  const isAdmin = hrRole === "admin";

  // ── Active tab ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "personal");
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setActiveTab(t);
  }, [searchParams]);

  // ── Profile state ──────────────────────────────────────────────────────────
  const nameParts  = (user?.name ?? "HR Admin").split(" ");
  const [profile, setProfile] = useState({
    firstName:  nameParts[0] ?? "HR",
    lastName:   nameParts.slice(1).join(" ") || "Admin",
    jobTitle:   hrRole === "admin" ? "Chief HR Officer" : hrRole === "hr_manager" ? "HR Manager" : "Technical Interviewer",
    department: "Human Resources",
    phone:      "+966 50 111 2233",
    location:   "Riyadh, Saudi Arabia",
    about:      "Passionate HR professional with 8+ years experience in talent acquisition and workforce development.",
    avatarUrl:  null,
    employeeId: `EMP-${Math.floor(10000 + Math.random() * 90000)}`,
    createdAt:  "2025-01-10",
    lastLogin:  "2026-06-07 09:15",
  });
  const [profileErrors, setProfileErrors] = useState({});

  // ── Notification prefs ─────────────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    email:        true,
    interviews:   true,
    candidates:   true,
    jobs:         false,
    system:       true,
  });

  // ── Security ───────────────────────────────────────────────────────────────
  const [twoFA, setTwoFA]             = useState(false);
  const [sessions, setSessions]       = useState(MOCK_SESSIONS);
  const [pwForm, setPwForm]           = useState({ current: "", next: "", confirm: "" });
  const [pwVisible, setPwVisible]     = useState({ current: false, next: false, confirm: false });
  const [pwErrors, setPwErrors]       = useState({});

  // ── UI state ───────────────────────────────────────────────────────────────
  const [toast, setToast]             = useState(null);
  const [confirm, setConfirm]         = useState(null);
  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  // ── Avatar upload ──────────────────────────────────────────────────────────
  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Image must be under 2 MB", "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setProfile((p) => ({ ...p, avatarUrl: ev.target.result }));
    reader.readAsDataURL(file);
  }

  // ── Save personal info ─────────────────────────────────────────────────────
  function handleSavePersonal() {
    const errs = {};
    if (!profile.firstName.trim()) errs.firstName = "Required";
    if (!profile.lastName.trim())  errs.lastName  = "Required";
    setProfileErrors(errs);
    if (Object.keys(errs).length) return;

    // Update auth context name
    login({ ...user, name: `${profile.firstName} ${profile.lastName}`, avatar: `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase() });
    showToast("Profile updated successfully");
  }

  // ── Save notifications ─────────────────────────────────────────────────────
  function handleSaveNotifications() {
    showToast("Notification preferences saved");
  }

  // ── Change password ────────────────────────────────────────────────────────
  function handleChangePassword() {
    const errs = {};
    if (!pwForm.current)              errs.current = "Required";
    if (pwForm.next.length < 8)       errs.next    = "Minimum 8 characters";
    if (pwForm.next !== pwForm.confirm) errs.confirm = "Passwords do not match";
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setPwForm({ current: "", next: "", confirm: "" });
    showToast("Password changed successfully");
  }

  // ── Logout other session ───────────────────────────────────────────────────
  function terminateSession(id) {
    setSessions((s) => s.filter((x) => x.id === "s1" || x.id !== id));
    showToast("Session terminated");
  }

  function handleLogoutAllOthers() {
    setConfirm({
      title:   "Logout Other Devices",
      message: "All other active sessions will be terminated immediately.",
      onConfirm: () => {
        setSessions((s) => s.filter((x) => x.current));
        setConfirm(null);
        showToast("All other sessions terminated");
      },
    });
  }

  // ── Avatar display ─────────────────────────────────────────────────────────
  const avatarInitials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();
  const roleLabel      = ROLE_LABELS[hrRole] ?? hrRole;
  const roleColor      = ROLE_COLORS[hrRole] ?? ROLE_COLORS.interviewer;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-[#001D39]">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your personal information and account settings</p>
      </div>

      {/* ── Profile Hero Card ── */}
      <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        {/* Cover gradient */}
        <div className="h-28 sm:h-36 relative" style={{ background: "linear-gradient(135deg,#001D39 0%,#0A4174 50%,#4E8EA2 100%)" }}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%,#7BBDE8 0%,transparent 50%),radial-gradient(circle at 80% 20%,#BDD8E9 0%,transparent 40%)" }}
          />
        </div>

        {/* Identity row */}
        <div className="bg-white px-6 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ring-4 ring-white shadow-lg overflow-hidden flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#0A4174,#49769F)" }}>
                {profile.avatarUrl
                  ? <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-white text-2xl sm:text-3xl font-extrabold">{avatarInitials}</span>
                }
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                <Camera size={13} className="text-[#0A4174]" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 pt-2 sm:pt-0 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold text-[#001D39]">{profile.firstName} {profile.lastName}</h2>
                <span
                  className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border"
                  style={{ background: roleColor.bg, color: roleColor.text, borderColor: roleColor.border }}
                >
                  {roleLabel}
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-0.5">{profile.jobTitle} · {profile.department}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Mail size={12} /> {user?.email ?? "—"}
                </span>
                {profile.location && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin size={12} /> {profile.location}
                  </span>
                )}
              </div>
            </div>

            {/* Edit pill */}
            <button
              onClick={() => setActiveTab("personal")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#0A4174] bg-[#EFF6FF] hover:bg-[#DBEAFE] transition-colors border border-[#BDD8E9] self-start sm:self-auto"
            >
              <Edit3 size={14} /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs + Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Tab sidebar */}
        <div className="space-y-1">
          {TABS.map((tab) => {
            const Icon   = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all ${active ? "text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                style={active ? { background: "linear-gradient(135deg,#0A4174,#4E8EA2)" } : {}}
              >
                <Icon size={16} />
                <span className="flex-1">{tab.label}</span>
                {active && <ChevronRight size={14} />}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="lg:col-span-3">

          {/* ══ PERSONAL INFORMATION ══════════════════════════════════════════ */}
          {activeTab === "personal" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 rounded-xl bg-blue-50"><User size={16} className="text-[#0A4174]" /></div>
                <div>
                  <h3 className="font-bold text-slate-800">Personal Information</h3>
                  <p className="text-xs text-slate-400">Update your personal details and public profile</p>
                </div>
              </div>

              {/* Photo row */}
              <div>
                <Label>Profile Photo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#0A4174,#49769F)" }}>
                    {profile.avatarUrl
                      ? <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      : <span className="text-white text-xl font-extrabold">{avatarInitials}</span>
                    }
                  </div>
                  <div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#0A4174] border-2 border-dashed border-[#BDD8E9] hover:border-[#0A4174] hover:bg-blue-50 transition-all"
                    >
                      <Camera size={15} /> Upload Photo
                    </button>
                    <p className="text-[11px] text-slate-400 mt-1.5">JPG, PNG or GIF — max 2 MB</p>
                  </div>
                </div>
              </div>

              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>First Name</Label>
                  <input value={profile.firstName} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))} className={inputCls(profileErrors.firstName)} placeholder="First name" />
                  {profileErrors.firstName && <p className="text-xs text-red-500 mt-1">{profileErrors.firstName}</p>}
                </div>
                <div>
                  <Label required>Last Name</Label>
                  <input value={profile.lastName} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))} className={inputCls(profileErrors.lastName)} placeholder="Last name" />
                  {profileErrors.lastName && <p className="text-xs text-red-500 mt-1">{profileErrors.lastName}</p>}
                </div>
              </div>

              {/* Job + Dept */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Job Title</Label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={profile.jobTitle} onChange={(e) => setProfile((p) => ({ ...p, jobTitle: e.target.value }))} className={`${inputCls()} pl-9`} placeholder="e.g. HR Manager" />
                  </div>
                </div>
                <div>
                  <Label>Department</Label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select value={profile.department} onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-slate-800">
                      {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Phone + Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number</Label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} className={`${inputCls()} pl-9`} placeholder="+966 50 000 0000" />
                  </div>
                </div>
                <div>
                  <Label>Location</Label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={profile.location} onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))} className={`${inputCls()} pl-9`} placeholder="City, Country" />
                  </div>
                </div>
              </div>

              {/* About */}
              <div>
                <Label>About Me</Label>
                <textarea
                  rows={3}
                  value={profile.about}
                  onChange={(e) => setProfile((p) => ({ ...p, about: e.target.value }))}
                  className={`${inputCls()} resize-none`}
                  placeholder="Brief description about yourself…"
                />
                <p className="text-[11px] text-slate-400 mt-1">{profile.about.length}/300 characters</p>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={handleSavePersonal} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}>
                  <Save size={15} /> Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ══ ACCOUNT INFORMATION ══════════════════════════════════════════ */}
          {activeTab === "account" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 rounded-xl bg-purple-50"><Shield size={16} className="text-purple-600" /></div>
                <div>
                  <h3 className="font-bold text-slate-800">Account Information</h3>
                  <p className="text-xs text-slate-400">Your account credentials and system assignment</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Employee ID */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Hash size={13} className="text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Employee ID</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 font-mono">{profile.employeeId}</p>
                </div>

                {/* Email */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail size={13} className="text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Email Address</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{user?.email ?? "—"}</p>
                </div>

                {/* Role */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield size={13} className="text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Role</span>
                    </div>
                    {!isAdmin && <span className="text-[10px] text-slate-400 italic">Admin only</span>}
                  </div>
                  {isAdmin ? (
                    <select className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200" defaultValue={hrRole}>
                      <option value="admin">Admin</option>
                      <option value="hr_manager">HR Manager</option>
                      <option value="interviewer">Interviewer</option>
                    </select>
                  ) : (
                    <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border"
                      style={{ background: roleColor.bg, color: roleColor.text, borderColor: roleColor.border }}>
                      {roleLabel}
                    </span>
                  )}
                </div>

                {/* Status */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={13} className="text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Account Status</span>
                    </div>
                    {!isAdmin && <span className="text-[10px] text-slate-400 italic">Admin only</span>}
                  </div>
                  {isAdmin ? (
                    <select className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200" defaultValue="Active">
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Suspended</option>
                    </select>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  )}
                </div>

                {/* Created */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={13} className="text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Account Created</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{profile.createdAt}</p>
                </div>

                {/* Last Login */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={13} className="text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Last Login</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{profile.lastLogin}</p>
                </div>
              </div>

              {isAdmin && (
                <div className="flex justify-end pt-2">
                  <button onClick={() => showToast("Account settings saved")} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md hover:opacity-90" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}>
                    <Save size={15} /> Save Changes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══ SECURITY ══════════════════════════════════════════════════════ */}
          {activeTab === "security" && (
            <div className="space-y-4">

              {/* Change Password */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2 rounded-xl bg-amber-50"><Key size={16} className="text-amber-600" /></div>
                  <div>
                    <h3 className="font-bold text-slate-800">Change Password</h3>
                    <p className="text-xs text-slate-400">Keep your account secure with a strong password</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Current */}
                  <div className="sm:col-span-2">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={pwVisible.current ? "text" : "password"}
                        value={pwForm.current}
                        onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                        className={`${inputCls(pwErrors.current)} pl-9 pr-10`}
                        placeholder="Enter current password"
                      />
                      <button type="button" onClick={() => setPwVisible((v) => ({ ...v, current: !v.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {pwVisible.current ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {pwErrors.current && <p className="text-xs text-red-500 mt-1">{pwErrors.current}</p>}
                  </div>

                  {/* New */}
                  <div>
                    <Label>New Password</Label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={pwVisible.next ? "text" : "password"}
                        value={pwForm.next}
                        onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                        className={`${inputCls(pwErrors.next)} pl-9 pr-10`}
                        placeholder="Min 8 characters"
                      />
                      <button type="button" onClick={() => setPwVisible((v) => ({ ...v, next: !v.next }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {pwVisible.next ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {pwErrors.next && <p className="text-xs text-red-500 mt-1">{pwErrors.next}</p>}
                  </div>

                  {/* Confirm */}
                  <div>
                    <Label>Confirm New Password</Label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={pwVisible.confirm ? "text" : "password"}
                        value={pwForm.confirm}
                        onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                        className={`${inputCls(pwErrors.confirm)} pl-9 pr-10`}
                        placeholder="Repeat new password"
                      />
                      <button type="button" onClick={() => setPwVisible((v) => ({ ...v, confirm: !v.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {pwVisible.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {pwErrors.confirm && <p className="text-xs text-red-500 mt-1">{pwErrors.confirm}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock size={12} />
                    Last changed: 30 days ago
                  </div>
                  <button onClick={handleChangePassword} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md hover:opacity-90" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}>
                    <Check size={15} /> Update Password
                  </button>
                </div>
              </div>

              {/* 2FA */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-50"><Smartphone size={16} className="text-emerald-600" /></div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Two-Factor Authentication</p>
                      <p className="text-xs text-slate-400 mt-0.5">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${twoFA ? "text-emerald-600" : "text-slate-400"}`}>{twoFA ? "Enabled" : "Disabled"}</span>
                    <Toggle checked={twoFA} onChange={(v) => { setTwoFA(v); showToast(v ? "Two-factor authentication enabled" : "Two-factor authentication disabled", v ? "success" : "info"); }} />
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50"><Monitor size={16} className="text-blue-600" /></div>
                    <div>
                      <h3 className="font-bold text-slate-800">Active Sessions</h3>
                      <p className="text-xs text-slate-400">Devices currently signed into your account</p>
                    </div>
                  </div>
                  {sessions.length > 1 && (
                    <button onClick={handleLogoutAllOthers} className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-xl border border-red-100 hover:bg-red-50 transition-colors">
                      <LogOut size={12} /> Logout All Others
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {sessions.map((s) => (
                    <div key={s.id} className={`flex items-center gap-4 p-4 rounded-xl border ${s.current ? "border-blue-100 bg-blue-50/40" : "border-slate-100 bg-slate-50/40"}`}>
                      <div className={`p-2 rounded-xl ${s.current ? "bg-blue-100" : "bg-slate-100"}`}>
                        <Monitor size={16} className={s.current ? "text-blue-600" : "text-slate-500"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{s.device}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-slate-400">{s.location}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className={`text-xs font-medium ${s.current ? "text-emerald-600" : "text-slate-400"}`}>{s.lastActive}</span>
                        </div>
                      </div>
                      {s.current ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Current</span>
                      ) : (
                        <button onClick={() => terminateSession(s.id)} className="text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-xl border border-red-100 hover:bg-red-50 transition-colors">
                          End
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ NOTIFICATION PREFERENCES ═════════════════════════════════════ */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 rounded-xl bg-orange-50"><Bell size={16} className="text-orange-500" /></div>
                <div>
                  <h3 className="font-bold text-slate-800">Notification Preferences</h3>
                  <p className="text-xs text-slate-400">Choose which notifications you want to receive</p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { key: "email",      label: "Email Notifications",    desc: "Receive important updates via email",             icon: Mail    },
                  { key: "interviews", label: "Interview Notifications", desc: "Alerts for scheduled and upcoming interviews",    icon: Calendar },
                  { key: "candidates", label: "Candidate Updates",       desc: "New applications and candidate status changes",   icon: User    },
                  { key: "jobs",       label: "Job Updates",             desc: "New job postings and role changes",               icon: Briefcase },
                  { key: "system",     label: "System Notifications",    desc: "Platform updates and maintenance alerts",         icon: Info    },
                ].map(({ key, label, desc, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 flex-shrink-0">
                        <Icon size={14} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                      </div>
                    </div>
                    <Toggle checked={notifPrefs[key]} onChange={(v) => setNotifPrefs((p) => ({ ...p, [key]: v }))} />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={handleSaveNotifications} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md hover:opacity-90" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}>
                  <Save size={15} /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* ══ ACTIVITY HISTORY ═════════════════════════════════════════════ */}
          {activeTab === "activity" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-slate-100"><Activity size={16} className="text-slate-600" /></div>
                <div>
                  <h3 className="font-bold text-slate-800">Activity History</h3>
                  <p className="text-xs text-slate-400">Your recent actions on the platform</p>
                </div>
              </div>

              <div className="divide-y divide-slate-50">
                {MOCK_ACTIVITY.map((item, idx) => {
                  const Icon = item.icon;
                  const isToday = item.date === "2026-06-07";
                  return (
                    <div key={item.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}18` }}>
                          <Icon size={14} style={{ color: item.color }} />
                        </div>
                        {idx < MOCK_ACTIVITY.length - 1 && <div className="w-px h-full bg-slate-100 mt-1 flex-1" style={{ minHeight: 12 }} />}
                      </div>

                      <div className="flex-1 min-w-0 pb-1">
                        <p className="text-sm font-semibold text-slate-800">{item.action}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.target}</p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs font-semibold ${isToday ? "text-blue-600" : "text-slate-400"}`}>
                          {isToday ? "Today" : item.date}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-400 text-center">Showing last 10 activities · Activity log retained for 90 days</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Confirm dialog ── */}
      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
