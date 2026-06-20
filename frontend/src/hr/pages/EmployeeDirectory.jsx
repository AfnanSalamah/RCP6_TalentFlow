import { useState, useMemo, useCallback } from "react";
import {
  Users, Search, Filter, Building2, ChevronDown, Mail, Phone,
  Eye, Pencil, Trash2, UserX, UserCheck, X, Check, AlertTriangle,
  MoreVertical, ShieldCheck, SlidersHorizontal, Grid3X3, List,
  CheckCircle, XCircle, UserCog, Crown, Shield, ClipboardCheck,
  Calendar, Clock, Hash,
} from "lucide-react";
import { initialUsers, SYSTEM_ROLES, DEPARTMENTS, STATUSES, hrRoleLabel } from "../data/usersData";
import { usePermissions } from "../rbac/usePermissions";
import { Card, CardContent } from "../components/ui/Card";

// ── Shared style helpers ─────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  ["#0A4174", "#BDD8E9"],
  ["#4E8EA2", "#EFF6FF"],
  ["#49769F", "#E0F2FE"],
  ["#001D39", "#7BBDE8"],
  ["#6EA2B3", "#DBEAFE"],
];
function avatarGradient(id) {
  return AVATAR_GRADIENTS[parseInt(id, 10) % AVATAR_GRADIENTS.length];
}

const ROLE_BADGE_CFG = {
  admin:       { label: "Admin",       bg: "#FEF3C7", text: "#92400E", border: "#FCD34D", icon: Crown         },
  hr_manager:  { label: "HR Manager",  bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD", icon: Shield        },
  interviewer: { label: "Interviewer", bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7", icon: ClipboardCheck },
};

const STATUS_STYLE = {
  Active:    { dot: "bg-emerald-400", pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Inactive:  { dot: "bg-slate-400",   pill: "bg-slate-50 text-slate-600 border-slate-200"     },
  Suspended: { dot: "bg-red-400",     pill: "bg-red-50 text-red-600 border-red-200"           },
};

function AvatarCircle({ initials, userId, size = "md" }) {
  const [bg, text] = avatarGradient(userId);
  const sz = size === "lg" ? "w-16 h-16 text-xl rounded-2xl" : "w-10 h-10 text-sm rounded-xl";
  return (
    <div className={`${sz} flex items-center justify-center font-bold flex-shrink-0`} style={{ background: bg, color: text }}>
      {initials}
    </div>
  );
}

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.Active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function RoleTag({ hrRole }) {
  const cfg = ROLE_BADGE_CFG[hrRole] ?? ROLE_BADGE_CFG.interviewer;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
      style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ── Confirm dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,29,57,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? "bg-red-50" : "bg-amber-50"}`}>
          <AlertTriangle size={26} className={danger ? "text-red-500" : "text-amber-500"} />
        </div>
        <h3 className="font-bold text-slate-800 text-lg mb-2">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"}`}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = "success", onClose }) {
  const styles = {
    success: { bg: "#ECFDF5", border: "#A7F3D0", text: "#065F46", icon: CheckCircle, iconColor: "#10B981" },
    error:   { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", icon: XCircle,     iconColor: "#EF4444" },
  };
  const s = styles[type] ?? styles.success;
  const Icon = s.icon;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border"
      style={{ background: s.bg, borderColor: s.border }}>
      <Icon size={18} style={{ color: s.iconColor }} />
      <p className="text-sm font-semibold" style={{ color: s.text }}>{message}</p>
      <button onClick={onClose} className="ml-2" style={{ color: s.text }}><X size={14} /></button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function EmployeeDirectory() {
  const { hrRole } = usePermissions();
  const isAdmin    = hrRole === "admin";

  const [users, setUsers]           = useState(initialUsers);
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy]         = useState("Name A–Z");
  const [viewMode, setViewMode]     = useState("grid");  // "grid" | "list"
  const [openMenu, setOpenMenu]     = useState(null);

  const [viewUser, setViewUser]     = useState(null);
  const [editUser, setEditUser]     = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [confirmDlg, setConfirmDlg] = useState(null);
  const [toast, setToast]           = useState(null);

  const showToast = useCallback((msg, type = "success") => setToast({ message: msg, type }), []);

  // ── Filtered + sorted list ─────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = [...users];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) => `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q));
    }
    if (filterRole   !== "All") list = list.filter((u) => u.hrRole     === filterRole);
    if (filterDept   !== "All") list = list.filter((u) => u.department === filterDept);
    if (filterStatus !== "All") list = list.filter((u) => u.status     === filterStatus);
    if (sortBy === "Name A–Z") list.sort((a, b) => a.firstName.localeCompare(b.firstName));
    if (sortBy === "Name Z–A") list.sort((a, b) => b.firstName.localeCompare(a.firstName));
    if (sortBy === "Newest")   list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sortBy === "Oldest")   list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return list;
  }, [users, search, filterRole, filterDept, filterStatus, sortBy]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const active    = users.filter((u) => u.status === "Active").length;
  const inactive  = users.filter((u) => u.status !== "Active").length;

  // ── Edit ───────────────────────────────────────────────────────────────────
  function openEdit(user) {
    setEditUser(user);
    setEditForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone ?? "", department: user.department, jobTitle: user.jobTitle ?? "", hrRole: user.hrRole, status: user.status, employeeId: user.employeeId ?? "", idNumber: user.idNumber ?? "" });
    setOpenMenu(null);
  }
  function handleEditSave() {
    if (!editForm.firstName?.trim() || !editForm.lastName?.trim()) return;
    setUsers((prev) => prev.map((u) => u.id === editUser.id ? {
      ...u, ...editForm,
      avatar: `${editForm.firstName[0]}${editForm.lastName[0]}`.toUpperCase(),
    } : u));
    setEditUser(null);
    showToast("Employee profile updated");
  }

  // ── Toggle status ──────────────────────────────────────────────────────────
  function toggleStatus(user) {
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    setConfirmDlg({
      title:   `${newStatus === "Inactive" ? "Disable" : "Enable"} Account`,
      message: `Are you sure you want to ${newStatus === "Inactive" ? "disable" : "re-enable"} ${user.firstName} ${user.lastName}'s account?`,
      danger:  newStatus === "Inactive",
      onConfirm: () => {
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: newStatus } : u));
        setConfirmDlg(null);
        showToast(`Account ${newStatus === "Active" ? "enabled" : "disabled"}`);
      },
    });
    setOpenMenu(null);
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  function handleDelete(user) {
    setConfirmDlg({
      title:   "Delete Employee",
      message: `This will permanently remove ${user.firstName} ${user.lastName} from the platform. This cannot be undone.`,
      danger:  true,
      onConfirm: () => {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setConfirmDlg(null);
        showToast("Employee removed from directory", "error");
      },
    });
    setOpenMenu(null);
  }

  const inputCls = "px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 appearance-none";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10" onClick={() => setOpenMenu(null)}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#001D39]">Employee Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Browse and manage all HR platform members</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{displayed.length} of {users.length} employees</span>
        </div>
      </div>

      {/* ── Stat pills ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: users.length, icon: Users, color: "#0A4174", bg: "#EFF6FF" },
          { label: "Active", value: active, icon: UserCheck, color: "#059669", bg: "#ECFDF5" },
          { label: "Inactive / Suspended", value: inactive, icon: UserX, color: "#64748b", bg: "#F8FAFC" },
          { label: "Departments", value: new Set(users.map((u) => u.department)).size, icon: Building2, color: "#7C3AED", bg: "#F5F3FF" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: s.bg }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-extrabold" style={{ color: "#001D39" }}>{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters bar ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or department…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>

          {/* Role filter */}
          <div className="relative">
            <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={`${inputCls} pl-8 pr-7`}>
              <option value="All">All Roles</option>
              {SYSTEM_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Dept filter */}
          <div className="relative">
            <Building2 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className={`${inputCls} pl-8 pr-7`}>
              <option value="All">All Departments</option>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`${inputCls} px-3 pr-7`}>
              <option value="All">All Status</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative ml-auto">
            <SlidersHorizontal size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`${inputCls} pl-8 pr-7`}>
              {["Name A–Z","Name Z–A","Newest","Oldest"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* View toggle */}
          <div className="flex gap-1 border border-slate-200 rounded-xl p-1">
            {[{ mode: "grid", icon: Grid3X3 }, { mode: "list", icon: List }].map(({ mode, icon: Icon }) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === mode ? "bg-[#0A4174] text-white" : "text-slate-400 hover:text-slate-600"}`}>
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ GRID VIEW ══════════════════════════════════════════════════════════ */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map((user) => (
            <div key={user.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
              {/* Card header gradient */}
              <div className="h-3 w-full" style={{ background: `linear-gradient(135deg,${avatarGradient(user.id)[0]},${avatarGradient(user.id)[1]})` }} />

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <AvatarCircle initials={user.avatar} userId={user.id} />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm leading-tight">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{user.jobTitle}</p>
                    </div>
                  </div>

                  {/* Context menu */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical size={15} />
                    </button>
                    {openMenu === user.id && (
                      <div className="absolute right-0 top-8 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 z-30 py-1 overflow-hidden">
                        <button onClick={() => { setViewUser(user); setOpenMenu(null); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700">
                          <Eye size={13} /> View Profile
                        </button>
                        {isAdmin && (
                          <>
                            <button onClick={() => openEdit(user)} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700">
                              <Pencil size={13} /> Edit
                            </button>
                            <button onClick={() => toggleStatus(user)} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700">
                              {user.status === "Active" ? <><UserX size={13} /> Disable</> : <><UserCheck size={13} /> Enable</>}
                            </button>
                            <div className="border-t border-slate-100 my-1" />
                            <button onClick={() => handleDelete(user)} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 size={13} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <RoleTag hrRole={user.hrRole} />
                  <StatusPill status={user.status} />
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Building2 size={11} className="text-slate-300 flex-shrink-0" />
                    <span className="truncate">{user.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail size={11} className="text-slate-300 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone size={11} className="text-slate-300 flex-shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <button
                  onClick={() => {
                    console.log("[EmployeeDirectory] View Profile clicked — employee:", user.id, `${user.firstName} ${user.lastName}`);
                    setViewUser(user);
                  }}
                  className="mt-4 w-full py-2 rounded-xl text-xs font-semibold text-[#0A4174] bg-[#EFF6FF] hover:bg-[#DBEAFE] active:bg-[#BFDBFE] transition-colors border border-[#BDD8E9] cursor-pointer select-none"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}

          {displayed.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <Users size={40} className="mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 font-semibold">No employees match your filters</p>
              <p className="text-slate-300 text-sm mt-1">Try adjusting search or filter criteria</p>
            </div>
          )}
        </div>
      )}

      {/* ══ LIST VIEW ══════════════════════════════════════════════════════════ */}
      {viewMode === "list" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["Employee", "Department", "Role", "Status", "Last Login", isAdmin ? "Actions" : ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((user) => (
                <tr key={user.id} className="border-b border-slate-50 hover:bg-[#F8FBFF] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <AvatarCircle initials={user.avatar} userId={user.id} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-slate-600 flex items-center gap-1.5">
                      <Building2 size={12} className="text-slate-300" />{user.department}
                    </span>
                  </td>
                  <td className="px-5 py-3.5"><RoleTag hrRole={user.hrRole} /></td>
                  <td className="px-5 py-3.5"><StatusPill status={user.status} /></td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{user.lastLogin}</td>
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewUser(user)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="View">
                        <Eye size={14} />
                      </button>
                      {isAdmin && (
                        <>
                          <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => toggleStatus(user)} className="p-1.5 rounded-lg hover:bg-orange-50 text-slate-400 hover:text-orange-600 transition-colors" title={user.status === "Active" ? "Disable" : "Enable"}>
                            {user.status === "Active" ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button onClick={() => handleDelete(user)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {displayed.length === 0 && (
            <div className="py-16 text-center">
              <Users size={36} className="mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 font-medium">No employees match your filters</p>
            </div>
          )}

          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-600">{displayed.length}</span> of <span className="font-semibold text-slate-600">{users.length}</span> employees
            </p>
          </div>
        </div>
      )}

      {/* ══ VIEW DRAWER ════════════════════════════════════════════════════════ */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-end"
          style={{ background: "rgba(0,29,57,0.35)", backdropFilter: "blur(3px)" }}
          onClick={() => setViewUser(null)}>
          <div className="h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="px-6 py-6 relative text-white" style={{ background: "linear-gradient(135deg,#001D39,#0A4174)" }}>
              <button onClick={() => setViewUser(null)} className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/15 hover:bg-white/25">
                <X size={16} className="text-white" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold" style={{ background: "rgba(255,255,255,0.15)" }}>
                  {viewUser.avatar}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{viewUser.firstName} {viewUser.lastName}</h2>
                  <p className="text-blue-200 text-sm mt-0.5">{viewUser.jobTitle}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusPill status={viewUser.status} />
                    <RoleTag hrRole={viewUser.hrRole} />
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              {[
                { icon: Mail,       label: "Email",        value: viewUser.email },
                { icon: Phone,      label: "Phone",        value: viewUser.phone || "—" },
                { icon: Building2,  label: "Department",   value: viewUser.department },
                { icon: ShieldCheck,label: "System Role",  value: hrRoleLabel(viewUser.hrRole) },
                { icon: UserCog,    label: "Status",       value: viewUser.status },
                { icon: Calendar,   label: "Member Since", value: viewUser.createdAt },
                { icon: Clock,      label: "Last Login",   value: viewUser.lastLogin },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className="p-2 rounded-xl bg-white shadow-sm flex-shrink-0">
                    <Icon size={14} style={{ color: "#4E8EA2" }} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer actions */}
            {isAdmin && (
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => { openEdit(viewUser); setViewUser(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}>
                  <Pencil size={14} /> Edit Profile
                </button>
                <button onClick={() => { handleDelete(viewUser); setViewUser(null); }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ EDIT MODAL ════════════════════════════════════════════════════════ */}
      {editUser && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,29,57,0.45)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50"><Pencil size={16} className="text-amber-600" /></div>
                <div>
                  <h2 className="font-bold text-slate-800 text-lg">Edit Employee</h2>
                  <p className="text-xs text-slate-400">{editUser.firstName} {editUser.lastName}</p>
                </div>
              </div>
              <button onClick={() => setEditUser(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[["firstName","First Name"],["lastName","Last Name"]].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{label}</label>
                    <input value={editForm[key] ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="email" value={editForm.email ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Employee ID</label>
                  <div className="relative">
                    <UserCog size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={editForm.employeeId ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, employeeId: e.target.value }))}
                      placeholder="e.g. ADM-001"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">ID Number</label>
                  <div className="relative">
                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={editForm.idNumber ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, idNumber: e.target.value }))}
                      placeholder="e.g. 1098765432"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Job Title</label>
                  <input value={editForm.jobTitle ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, jobTitle: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Department</label>
                  <select value={editForm.department ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">System Role</label>
                  <select value={editForm.hrRole ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, hrRole: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                    {SYSTEM_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Status</label>
                  <div className="flex gap-2">
                    {["Active","Inactive"].map((s) => (
                      <button key={s} onClick={() => setEditForm((f) => ({ ...f, status: s }))}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${editForm.status === s ? "text-white border-transparent shadow-sm" : "border-slate-200 text-slate-500 hover:border-blue-200"}`}
                        style={editForm.status === s ? { background: s === "Active" ? "#059669" : "#64748B" } : {}}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditUser(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
                <button onClick={handleEditSave} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}>
                  <Check size={15} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {confirmDlg && <ConfirmDialog {...confirmDlg} onCancel={() => setConfirmDlg(null)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

