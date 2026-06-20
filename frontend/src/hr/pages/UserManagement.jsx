import { useEffect, useState, useMemo } from "react";
import {
  Users, UserPlus, Search, Filter, MoreVertical,
  Eye, Pencil, Trash2, AlertTriangle, X, Check,
  ShieldCheck, UserCheck, UserX, ChevronDown,
  Mail, Phone, Building2, Briefcase, Lock,
  SlidersHorizontal, Hash, Shield, Crown, ClipboardCheck,
  ChevronRight,
} from "lucide-react";
import {
  initialUsers, SYSTEM_ROLES, DEPARTMENTS, STATUSES, hrRoleLabel,
} from "../data/usersData";
import { hrUsersApi } from "../../api/index";
import { generateEmployeeId } from "../rbac/employeeIdUtils";
import {
  ROLE_PERMISSION_MODULES,
  ROLE_PERMISSION_STORAGE_KEY,
  ROUTE_PERMISSIONS,
  getRoutePermissions,
  saveRoutePermissions,
} from "../rbac/rbacConfig";
import { Card, CardContent } from "../components/ui/Card";

// ─── Role badge config ────────────────────────────────────────────────────────

const ROLE_BADGE = {
  admin: {
    label:   "Admin",
    bg:      "#FEF3C7",
    text:    "#92400E",
    border:  "#FCD34D",
    icon:    Crown,
    iconBg:  "#FEF3C7",
  },
  hr_manager: {
    label:   "HR Manager",
    bg:      "#DBEAFE",
    text:    "#1E40AF",
    border:  "#93C5FD",
    icon:    Shield,
    iconBg:  "#DBEAFE",
  },
  interviewer: {
    label:   "Interviewer",
    bg:      "#D1FAE5",
    text:    "#065F46",
    border:  "#6EE7B7",
    icon:    ClipboardCheck,
    iconBg:  "#D1FAE5",
  },
};

function RoleBadge({ hrRole }) {
  const cfg = ROLE_BADGE[hrRole] ?? ROLE_BADGE.interviewer;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
      style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
    >
      <cfg.icon size={11} />
      {cfg.label}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  ["#0A4174", "#BDD8E9"],
  ["#4E8EA2", "#EFF6FF"],
  ["#49769F", "#E0F2FE"],
  ["#001D39", "#7BBDE8"],
  ["#6EA2B3", "#DBEAFE"],
];
function avatarColor(id) {
  return AVATAR_COLORS[parseInt(id, 10) % AVATAR_COLORS.length];
}
function Avatar({ initials, userId }) {
  const [bg, text] = avatarColor(userId);
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 select-none"
      style={{ background: bg, color: text }}
    >
      {initials}
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  Active:    { dot: "bg-emerald-400", pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Inactive:  { dot: "bg-slate-400",   pill: "bg-slate-50 text-slate-600 border-slate-200"     },
  Suspended: { dot: "bg-red-400",     pill: "bg-red-50 text-red-600 border-red-200"           },
};

// ─── Form field helpers ───────────────────────────────────────────────────────

function FieldGroup({ label, icon: Icon, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        )}
        {children}
      </div>
    </div>
  );
}

const inputCls = (hasIcon = true, hasErr = false) =>
  `w-full border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all bg-white text-slate-800 ${
    hasIcon ? "pl-9 pr-3 py-2.5" : "px-3 py-2.5"
  } ${
    hasErr
      ? "border-red-300 focus:ring-red-200"
      : "border-slate-200 focus:ring-blue-300 focus:border-blue-400"
  }`;

// ─── Role selector card (used in Add / Edit forms) ────────────────────────────

function RoleSelector({ value, onChange, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
        System Role<span className="text-red-400 ml-0.5">*</span>
      </label>

      <div className="grid gap-2.5">
        {SYSTEM_ROLES.map((role) => {
          const cfg    = ROLE_BADGE[role.id];
          const active = value === role.id;
          const Icon   = cfg.icon;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onChange(role.id)}
              className={`
                w-full text-left flex items-start gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all duration-150
                ${active
                  ? "shadow-sm"
                  : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/60"
                }
              `}
              style={active ? { borderColor: cfg.border, background: `${cfg.bg}66` } : {}}
            >
              {/* Icon bubble */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: active ? cfg.bg : "#f1f5f9" }}
              >
                <Icon size={16} style={{ color: active ? cfg.text : "#94a3b8" }} />
              </div>

              {/* Label + description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className="text-sm font-bold leading-tight"
                    style={{ color: active ? cfg.text : "#1e293b" }}
                  >
                    {role.label}
                  </p>
                  {active && (
                    <span
                      className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full"
                      style={{ background: cfg.bg, color: cfg.text }}
                    >
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                  {role.description}
                </p>
              </div>

              {/* Radio indicator */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-colors ${
                  active ? "border-transparent" : "border-slate-300"
                }`}
                style={active ? { background: cfg.text } : {}}
              >
                {active && <Check size={11} className="text-white" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-500 font-medium mt-2">
          <AlertTriangle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ─── empty form ───────────────────────────────────────────────────────────────

function emptyForm() {
  return {
    firstName:       "",
    lastName:        "",
    email:           "",
    phone:           "",
    department:      "",
    jobTitle:        "",
    hrRole:          "",      // required — no default
    employeeId:      "",
    idNumber:        "",
    password:        "",
    confirmPassword: "",
    status:          "Active",
  };
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="py-5 flex items-center gap-4">
        <div className="p-3 rounded-2xl flex-shrink-0" style={{ background: bg }}>
          <Icon size={20} style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: "#001D39" }}>{value}</p>
          <p className="text-sm text-slate-500 mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function RolePermissionsPanel() {
  const roles = SYSTEM_ROLES.map((r) => ({ id: r.id, label: r.label }));
  const [permissions, setPermissions] = useState(() => getRoutePermissions());
  const [saved, setSaved] = useState(false);

  const toggle = (path, role) => {
    setPermissions((current) => {
      const allowed = current[path] || ROUTE_PERMISSIONS[path] || [];
      const nextAllowed = allowed.includes(role)
        ? allowed.filter((r) => r !== role && r !== "super_admin")
        : [...new Set([...allowed, role])];
      return { ...current, [path]: ["super_admin", ...nextAllowed.filter((r) => r !== "super_admin")] };
    });
    setSaved(false);
  };

  const resetDefaults = () => {
    window.localStorage.removeItem(ROLE_PERMISSION_STORAGE_KEY);
    setPermissions(ROUTE_PERMISSIONS);
    window.dispatchEvent(new CustomEvent("tf:role-permissions-updated"));
    setSaved(true);
  };

  const save = () => {
    saveRoutePermissions(permissions);
    setSaved(true);
  };

  return (
    <Card>
      <CardContent className="py-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2"><ShieldCheck size={16} /> Role visibility & permissions</h2>
            <p className="text-xs text-slate-500 mt-1">Choose which pages are visible for HR managers, interviewers, and admins.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={resetDefaults} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Reset</button>
            <button onClick={save} className="px-3 py-2 rounded-xl text-white text-xs font-semibold" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}>
              {saved ? "Saved" : "Save Permissions"}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase">Page</th>
                {roles.map((role) => <th key={role.id} className="px-3 py-2 text-center text-xs font-semibold text-slate-400 uppercase">{role.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {ROLE_PERMISSION_MODULES.map((module) => (
                <tr key={module.path} className="border-b border-slate-50">
                  <td className="px-3 py-2 text-sm font-medium text-slate-700">{module.label}</td>
                  {roles.map((role) => {
                    const checked = (permissions[module.path] || []).includes(role.id);
                    const disabled = role.id === "admin" && ["/hr/users", "/hr/settings"].includes(module.path);
                    return (
                      <td key={role.id} className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggle(module.path, role.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-300 disabled:opacity-50"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function roleDefaultPaths(role) {
  if (!role) return [];
  const permissions = getRoutePermissions();
  return ROLE_PERMISSION_MODULES
    .filter((module) => (permissions[module.path] || []).includes(role))
    .map((module) => module.path);
}

function savePathsForRole(role, paths) {
  if (!role) return;
  const current = getRoutePermissions();
  const selected = new Set(paths);
  const next = { ...current };
  ROLE_PERMISSION_MODULES.forEach((module) => {
    const existing = next[module.path] || ROUTE_PERMISSIONS[module.path] || ["super_admin"];
    const withoutRole = existing.filter((r) => r !== role);
    next[module.path] = selected.has(module.path)
      ? [...new Set(["super_admin", ...withoutRole.filter((r) => r !== "super_admin"), role])]
      : [...new Set(["super_admin", ...withoutRole.filter((r) => r !== "super_admin")])];
  });
  saveRoutePermissions(next);
}

function InlineRolePermissions({ role, selectedPaths, onChange }) {
  if (!role) {
    return (
      <div className="mt-4 p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-400">
        Select a system role to choose visible pages.
      </div>
    );
  }

  const toggle = (path) => {
    const set = new Set(selectedPaths);
    if (set.has(path)) set.delete(path);
    else set.add(path);
    onChange([...set]);
  };

  return (
    <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Visible pages for this role</p>
          <p className="text-xs text-slate-400 mt-1">These checkboxes control what this role can see in the HR portal.</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700">
          {selectedPaths.length} selected
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ROLE_PERMISSION_MODULES.map((module) => {
          const checked = selectedPaths.includes(module.path);
          const locked = role === "admin" && ["/hr/users", "/hr/settings"].includes(module.path);
          return (
            <label
              key={module.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                checked ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-white"
              } ${locked ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={locked}
                onChange={() => toggle(module.path)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-300"
              />
              <span className="font-medium">{module.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users,        setUsers]        = useState(initialUsers);

  useEffect(() => {
    hrUsersApi.list()
      .then((data) => {
        const raw = Array.isArray(data) ? data : (data?.users || data?.employees || []);
        if (raw.length) {
          setUsers(raw.map((u) => {
            const display = u.displayName || u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim();
            const parts = display.split(" ");
            return {
              id: String(u.id),
              employeeId: u.employeeId || u.employee_id || "",
              firstName: parts[0] || display,
              lastName: parts.slice(1).join(" ") || "",
              email: u.email,
              phone: u.phone || "",
              department: u.department || "",
              jobTitle: u.title || u.jobTitle || "",
              hrRole: u.hrRole || u.role || "interviewer",
              status: (u.status || "active").toLowerCase() === "active" ? "Active" : "Inactive",
              avatar: u.avatar || display.slice(0,2).toUpperCase(),
              lastLogin: "—",
              createdAt: u.created_at || u.createdAt || "",
            };
          }));
        }
      })
      .catch(() => null);
  }, []);
  const [search,       setSearch]       = useState("");
  const [filterRole,   setFilterRole]   = useState("All");
  const [filterDept,   setFilterDept]   = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy,       setSortBy]       = useState("Name A–Z");
  const [openMenu,     setOpenMenu]     = useState(null);

  // modals
  const [addOpen,    setAddOpen]    = useState(false);
  const [editUser,   setEditUser]   = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [viewUser,   setViewUser]   = useState(null);

  // forms
  const [addForm,   setAddForm]   = useState(emptyForm());
  const [addRoutePaths, setAddRoutePaths] = useState([]);
  const [addErrors, setAddErrors] = useState({});
  const [addSaving, setAddSaving] = useState(false);
  const [editForm,  setEditForm]  = useState({});
  const [editErrors,setEditErrors]= useState({});

  // ── filtered + sorted list ─────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = [...users];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.employeeId ?? "").toLowerCase().includes(q),
      );
    }
    if (filterRole   !== "All") list = list.filter((u) => hrRoleLabel(u.hrRole) === filterRole);
    if (filterDept   !== "All") list = list.filter((u) => u.department === filterDept);
    if (filterStatus !== "All") list = list.filter((u) => u.status === filterStatus);

    if (sortBy === "Name A–Z") list.sort((a, b) => a.firstName.localeCompare(b.firstName));
    if (sortBy === "Name Z–A") list.sort((a, b) => b.firstName.localeCompare(a.firstName));
    if (sortBy === "Newest")   list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sortBy === "Oldest")   list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (sortBy === "Last Login") list.sort((a, b) => b.lastLogin.localeCompare(a.lastLogin));

    return list;
  }, [users, search, filterRole, filterDept, filterStatus, sortBy]);

  // ── stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total:       users.length,
    active:      users.filter((u) => u.status === "Active").length,
    inactive:    users.filter((u) => u.status !== "Active").length,
    admins:      users.filter((u) => u.hrRole === "admin").length,
    hrManagers:  users.filter((u) => u.hrRole === "hr_manager").length,
    interviewers:users.filter((u) => u.hrRole === "interviewer").length,
  };

  // ── add user ───────────────────────────────────────────────────────────────
  function handleAddRoleChange(role) {
    setAddForm({ ...addForm, hrRole: role });
    setAddRoutePaths(roleDefaultPaths(role));
  }

  function validateAdd() {
    const e = {};
    if (!addForm.firstName.trim())                             e.firstName = "Required";
    if (!addForm.lastName.trim())                              e.lastName  = "Required";
    if (!addForm.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))   e.email     = "Valid email required";
    if (!addForm.department)                                   e.department= "Required";
    if (!addForm.hrRole)                                       e.hrRole    = "Please select a user role.";
    if (addForm.password.length < 8)                           e.password  = "Min 8 characters";
    if (addForm.password !== addForm.confirmPassword)          e.confirmPassword = "Passwords do not match";
    setAddErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleAddSave() {
    if (!validateAdd()) return;
    setAddSaving(true);
    setAddErrors({});
    savePathsForRole(addForm.hrRole, addRoutePaths);
    // Use manually entered Employee ID if provided, otherwise auto-generate
    const employeeId = addForm.employeeId.trim() || generateEmployeeId(addForm.hrRole, users);
    const newUser = {
      id:         String(Date.now()),
      employeeId,
      idNumber:   addForm.idNumber.trim(),
      firstName:  addForm.firstName.trim(),
      lastName:   addForm.lastName.trim(),
      email:      addForm.email.trim(),
      phone:      addForm.phone.trim(),
      department: addForm.department,
      jobTitle:   addForm.jobTitle.trim(),
      hrRole:     addForm.hrRole,
      status:     addForm.status,
      lastLogin:  "Never",
      avatar:     (addForm.firstName[0] + addForm.lastName[0]).toUpperCase(),
      createdAt:  new Date().toISOString().split("T")[0],
    };
    const payload = {
      employee_id: employeeId,
      name: `${addForm.firstName.trim()} ${addForm.lastName.trim()}`.trim(),
      email: addForm.email.trim(),
      password: addForm.password,
      role: addForm.hrRole,
      title: addForm.jobTitle.trim(),
      department: addForm.department,
    };
    try {
      console.log("[UserManagement] Creating user", payload);
      const saved = await hrUsersApi.create(payload);
      console.log("[UserManagement] Create user success", saved);
      const display = saved.displayName || saved.name || payload.name;
      const parts = display.split(" ");
      setUsers((prev) => [{ ...newUser, id: String(saved.id || newUser.id), firstName: parts[0] || newUser.firstName, lastName: parts.slice(1).join(" "), employeeId: saved.employeeId || employeeId }, ...prev]);
      setAddOpen(false);
      setAddForm(emptyForm());
      setAddRoutePaths([]);
      setAddErrors({});
    } catch (err) {
      console.error("[UserManagement] Create user failed", err);
      setAddErrors({ submit: err?.message || "Could not create user. Please check the form and try again." });
    } finally {
      setAddSaving(false);
    }
  }

  // ── edit user ──────────────────────────────────────────────────────────────
  function openEdit(user) {
    setEditUser(user);
    setEditForm({
      firstName:  user.firstName,
      lastName:   user.lastName,
      email:      user.email,
      department: user.department,
      hrRole:     user.hrRole,
      status:     user.status,
      jobTitle:   user.jobTitle ?? "",
      employeeId: user.employeeId ?? "",
      idNumber:   user.idNumber ?? "",
    });
    setEditErrors({});
    setOpenMenu(null);
  }

  function validateEdit() {
    const e = {};
    if (!editForm.firstName?.trim())                                      e.firstName = "Required";
    if (!editForm.lastName?.trim())                                        e.lastName  = "Required";
    if (!editForm.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))            e.email     = "Valid email required";
    if (!editForm.hrRole)                                                  e.hrRole    = "Please select a user role.";
    setEditErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleEditSave() {
    if (!validateEdit() || !editUser) return;
    const applyLocal = () =>
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUser.id
            ? {
                ...u,
                ...editForm,
                avatar: (
                  (editForm.firstName ?? u.firstName)[0] +
                  (editForm.lastName  ?? u.lastName)[0]
                ).toUpperCase(),
              }
            : u,
        ),
      );
    // Persist to SQLite via the HR users API, then reflect locally.
    const payload = {
      name: `${editForm.firstName ?? ""} ${editForm.lastName ?? ""}`.trim(),
      title: editForm.jobTitle ?? "",
      department: editForm.department ?? "",
      role: editForm.hrRole,
      status: (editForm.status || "Active").toLowerCase(),
    };
    hrUsersApi.update(editUser.id, payload)
      .then(() => { applyLocal(); setEditUser(null); })
      .catch((err) => setEditErrors({ ...editErrors, submit: err?.message || "Failed to save user" }));
  }

  // ── delete user ────────────────────────────────────────────────────────────
  function handleDelete() {
    if (!deleteUser) return;
    // Backend soft-deletes (status → inactive); reflect that instead of dropping the row.
    hrUsersApi.delete(deleteUser.id)
      .then(() =>
        setUsers((prev) =>
          prev.map((u) => (u.id === deleteUser.id ? { ...u, status: "Inactive" } : u)),
        ),
      )
      .catch(() => setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id)))
      .finally(() => setDeleteUser(null));
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6" onClick={() => setOpenMenu(null)}>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#001D39" }}>User Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage HR platform users, roles, and permissions</p>
        </div>
        <button
          onClick={() => { setAddOpen(true); setAddRoutePaths([]); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all"
          style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}
        >
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Users"   value={stats.total}        icon={Users}      color="#0A4174" bg="#EFF6FF" />
        <StatCard label="Active"        value={stats.active}       icon={UserCheck}  color="#059669" bg="#ECFDF5" />
        <StatCard label="Inactive"      value={stats.inactive}     icon={UserX}      color="#64748b" bg="#F8FAFC" />
        <StatCard label="Admins"        value={stats.admins}       icon={Crown}      color="#92400E" bg="#FEF3C7" />
        <StatCard label="HR Managers"   value={stats.hrManagers}   icon={Shield}     color="#1E40AF" bg="#DBEAFE" />
        <StatCard label="Interviewers"  value={stats.interviewers} icon={ClipboardCheck} color="#065F46" bg="#D1FAE5" />
      </div>

      {/* ── Search & Filters ── */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-52">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Role filter */}
            <div className="relative">
              <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none cursor-pointer"
              >
                <option value="All">All Roles</option>
                {SYSTEM_ROLES.map((r) => <option key={r.id}>{r.label}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Dept filter */}
            <div className="relative">
              <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none cursor-pointer"
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none cursor-pointer"
              >
                <option value="All">All Status</option>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative ml-auto">
              <SlidersHorizontal size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none cursor-pointer"
              >
                {["Name A–Z","Name Z–A","Newest","Oldest","Last Login"].map((s) => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Table ── */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                {["User", "Department", "System Role", "Status", "Last Login", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((user) => {
                const ss = STATUS_STYLE[user.status] ?? STATUS_STYLE.Active;
                return (
                  <tr
                    key={user.id}
                    className="border-b border-slate-50 transition-colors duration-100"
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FBFF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    {/* User */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar initials={user.avatar} userId={user.id} />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{user.firstName} {user.lastName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {user.employeeId && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono tracking-wide">
                                {user.employeeId}
                              </span>
                            )}
                            {user.idNumber && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-400 font-mono tracking-wide">
                                ID {user.idNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={12} className="text-slate-300 flex-shrink-0" />
                        <span className="text-sm text-slate-600">{user.department}</span>
                      </div>
                    </td>

                    {/* System Role */}
                    <td className="px-5 py-3.5">
                      <RoleBadge hrRole={user.hrRole} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${ss.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                        {user.status}
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{user.lastLogin}</td>

                    {/* Actions */}
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openMenu === user.id && (
                          <div className="absolute right-0 top-10 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 z-30 py-1 overflow-hidden">
                            <button onClick={() => { setViewUser(user); setOpenMenu(null); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                              <Eye size={14} /> View
                            </button>
                            <button onClick={() => openEdit(user)}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
                              <Pencil size={14} /> Edit
                            </button>
                            <div className="border-t border-slate-100 my-1" />
                            <button onClick={() => { setDeleteUser(user); setOpenMenu(null); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {displayed.length === 0 && (
            <div className="py-16 text-center">
              <Users size={36} className="mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 font-medium">No users match your filters</p>
              <p className="text-slate-300 text-sm mt-1">Try adjusting the search or filters above</p>
            </div>
          )}
        </div>

        {/* Table footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Showing <span className="font-semibold text-slate-600">{displayed.length}</span> of{" "}
            <span className="font-semibold text-slate-600">{users.length}</span> users
          </p>
        </div>
      </Card>

      {/* ══════════════════════════════════════════════════════════════
           ADD USER MODAL
        ══════════════════════════════════════════════════════════════ */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,29,57,0.45)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ background: "#EFF6FF" }}>
                  <UserPlus size={18} style={{ color: "#0A4174" }} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-lg">Add New User</h2>
                  <p className="text-xs text-slate-400">Fill in the details to create an account</p>
                </div>
              </div>
              <button
                onClick={() => { setAddOpen(false); setAddForm(emptyForm()); setAddRoutePaths([]); setAddErrors({}); }}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* ── Personal details ── */}
              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Personal Details</p>
                <div className="space-y-4">
                  {/* Name row */}
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup label="First Name" icon={Users} required>
                      <input
                        value={addForm.firstName}
                        onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                        placeholder="Ahmed"
                        className={inputCls(true, !!addErrors.firstName)}
                      />
                      {addErrors.firstName && <p className="text-xs text-red-500 mt-1">{addErrors.firstName}</p>}
                    </FieldGroup>
                    <FieldGroup label="Last Name" icon={Users} required>
                      <input
                        value={addForm.lastName}
                        onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                        placeholder="Al-Rashidi"
                        className={inputCls(true, !!addErrors.lastName)}
                      />
                      {addErrors.lastName && <p className="text-xs text-red-500 mt-1">{addErrors.lastName}</p>}
                    </FieldGroup>
                  </div>

                  {/* Email + Phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup label="Email Address" icon={Mail} required>
                      <input
                        type="email"
                        value={addForm.email}
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                        placeholder="user@talentflow.ai"
                        className={inputCls(true, !!addErrors.email)}
                      />
                      {addErrors.email && <p className="text-xs text-red-500 mt-1">{addErrors.email}</p>}
                    </FieldGroup>
                    <FieldGroup label="Phone Number" icon={Phone}>
                      <input
                        type="tel"
                        value={addForm.phone}
                        onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                        placeholder="+966 50 000 0000"
                        className={inputCls()}
                      />
                    </FieldGroup>
                  </div>

                  {/* Employee ID + ID Number */}
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup label="Employee ID" icon={Hash}>
                      <input
                        type="text"
                        value={addForm.employeeId}
                        onChange={(e) => setAddForm({ ...addForm, employeeId: e.target.value })}
                        placeholder="e.g. ADM-001"
                        className={inputCls()}
                      />
                    </FieldGroup>
                    <FieldGroup label="ID Number" icon={Hash}>
                      <input
                        type="text"
                        value={addForm.idNumber}
                        onChange={(e) => setAddForm({ ...addForm, idNumber: e.target.value })}
                        placeholder="e.g. 1098765432"
                        className={inputCls()}
                      />
                    </FieldGroup>
                  </div>

                  {/* Dept + Job Title */}
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup label="Department" icon={Building2} required>
                      <select
                        value={addForm.department}
                        onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                        className={inputCls(true, !!addErrors.department)}
                      >
                        <option value="">Select department</option>
                        {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                      {addErrors.department && <p className="text-xs text-red-500 mt-1">{addErrors.department}</p>}
                    </FieldGroup>
                    <FieldGroup label="Job Title" icon={Briefcase}>
                      <input
                        value={addForm.jobTitle}
                        onChange={(e) => setAddForm({ ...addForm, jobTitle: e.target.value })}
                        placeholder="e.g. HR Manager"
                        className={inputCls()}
                      />
                    </FieldGroup>
                  </div>
                </div>
              </section>

              {/* ── System Role selector ── */}
              <section className="p-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Access & Permissions</p>
                <FieldGroup label="Employee Role" icon={ShieldCheck} required>
                  <select
                    value={addForm.hrRole}
                    onChange={(e) => handleAddRoleChange(e.target.value)}
                    className={inputCls(true, !!addErrors.hrRole)}
                  >
                    <option value="">Select employee role</option>
                    <option value="admin">Admin</option>
                    <option value="hr_manager">HR Employee</option>
                    <option value="interviewer">Interviewer</option>
                  </select>
                  {addErrors.hrRole && <p className="text-xs text-red-500 mt-1">{addErrors.hrRole}</p>}
                </FieldGroup>

                <InlineRolePermissions
                  role={addForm.hrRole}
                  selectedPaths={addRoutePaths}
                  onChange={setAddRoutePaths}
                />

                {/* Employee ID preview — shown once a role is selected */}
                {addForm.hrRole && (
                  <div className="flex items-center gap-3 mt-4 p-3.5 rounded-xl bg-white border border-slate-200">
                    <Hash size={14} className="text-slate-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Auto-generated Employee ID</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: "#0A4174", fontFamily: "monospace" }}>
                        {generateEmployeeId(addForm.hrRole, users)}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">assigned on save</span>
                  </div>
                )}
              </section>

              {/* ── Account status ── */}
              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Account Status</p>
                <div className="flex gap-2">
                  {STATUSES.map((s) => {
                    const active = addForm.status === s;
                    const colors = { Active: "#059669", Inactive: "#64748B", Suspended: "#DC2626" };
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setAddForm({ ...addForm, status: s })}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${active ? "text-white border-transparent shadow-sm" : "border-slate-200 text-slate-500 hover:border-blue-200"}`}
                        style={active ? { background: colors[s] } : {}}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ── Password ── */}
              <section className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Security</p>
                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="Password" icon={Lock} required>
                    <input
                      type="password"
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      placeholder="Min 8 characters"
                      className={inputCls(true, !!addErrors.password)}
                    />
                    {addErrors.password && <p className="text-xs text-red-500 mt-1">{addErrors.password}</p>}
                  </FieldGroup>
                  <FieldGroup label="Confirm Password" icon={Lock} required>
                    <input
                      type="password"
                      value={addForm.confirmPassword}
                      onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })}
                      placeholder="Repeat password"
                      className={inputCls(true, !!addErrors.confirmPassword)}
                    />
                    {addErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{addErrors.confirmPassword}</p>}
                  </FieldGroup>
                </div>
              </section>

              {/* Actions */}
              {addErrors.submit && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {addErrors.submit}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setAddOpen(false); setAddForm(emptyForm()); setAddRoutePaths([]); setAddErrors({}); }}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSave}
                  disabled={addSaving}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md hover:opacity-90 transition-all"
                  style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)", opacity: addSaving ? 0.7 : 1 }}
                >
                  <Check size={15} /> {addSaving ? "Creating..." : "Create User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
           EDIT USER MODAL
        ══════════════════════════════════════════════════════════════ */}
      {editUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,29,57,0.45)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[94vh] overflow-y-auto">

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50">
                  <Pencil size={16} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-lg">Edit User</h2>
                  <p className="text-xs text-slate-400">{editUser.firstName} {editUser.lastName}</p>
                </div>
              </div>
              <button onClick={() => setEditUser(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Personal fields */}
              <section className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Personal Details</p>

                <div className="grid grid-cols-2 gap-4">
                  {[["firstName","First Name"],["lastName","Last Name"]].map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}<span className="text-red-400 ml-0.5">*</span></label>
                      <input
                        value={editForm[key] ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all bg-white ${editErrors[key] ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:ring-blue-300"}`}
                      />
                      {editErrors[key] && <p className="text-xs text-red-500 mt-1">{editErrors[key]}</p>}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    type="email"
                    value={editForm.email ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all bg-white ${editErrors.email ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:ring-blue-300"}`}
                  />
                  {editErrors.email && <p className="text-xs text-red-500 mt-1">{editErrors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Job Title</label>
                    <input
                      value={editForm.jobTitle ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Department</label>
                    <select
                      value={editForm.department ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                    >
                      {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Employee ID</label>
                    <input
                      value={editForm.employeeId ?? ""}
                      readOnly
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-400 font-mono cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">ID Number</label>
                    <input
                      type="text"
                      value={editForm.idNumber ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, idNumber: e.target.value })}
                      placeholder="e.g. 1098765432"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                    />
                  </div>
                </div>

                {/* Status buttons */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Status</label>
                  <div className="flex gap-2">
                    {STATUSES.map((s) => {
                      const active = editForm.status === s;
                      const colors = { Active: "#059669", Inactive: "#64748B", Suspended: "#DC2626" };
                      return (
                        <button
                          key={s}
                          onClick={() => setEditForm({ ...editForm, status: s })}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${active ? "text-white border-transparent shadow-sm" : "border-slate-200 text-slate-500 hover:border-blue-200"}`}
                          style={active ? { background: colors[s] } : {}}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Role selector */}
              <section className="p-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">System Role</p>

                {/* Role change notice */}
                {editForm.hrRole && editForm.hrRole !== editUser.hrRole && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 mb-3">
                    <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                    <p className="text-xs font-medium text-amber-700">
                      Role change will update navigation, routes, and permissions immediately upon save.
                    </p>
                  </div>
                )}

                <RoleSelector
                  value={editForm.hrRole ?? ""}
                  onChange={(v) => setEditForm({ ...editForm, hrRole: v })}
                  error={editErrors.hrRole}
                />
              </section>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditUser(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md hover:opacity-90 transition-all"
                  style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}
                >
                  <Check size={15} /> Update User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
           DELETE MODAL
        ══════════════════════════════════════════════════════════════ */}
      {deleteUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,29,57,0.45)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle size={30} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Delete User</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-slate-800">{deleteUser.firstName} {deleteUser.lastName}</span>?
                <br />This action cannot be undone.
              </p>

              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl mt-4 w-full">
                <Avatar initials={deleteUser.avatar} userId={deleteUser.id} />
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800">{deleteUser.firstName} {deleteUser.lastName}</p>
                  <p className="text-xs text-slate-400">{deleteUser.email}</p>
                </div>
                <div className="ml-auto"><RoleBadge hrRole={deleteUser.hrRole} /></div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteUser(null)} className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-md">
                <Trash2 size={14} /> Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
           VIEW USER DRAWER
        ══════════════════════════════════════════════════════════════ */}
      {viewUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end"
          style={{ background: "rgba(0,29,57,0.35)", backdropFilter: "blur(3px)" }}
          onClick={() => setViewUser(null)}
        >
          <div
            className="h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="px-6 py-6 text-white relative" style={{ background: "linear-gradient(135deg,#001D39,#0A4174)" }}>
              <button onClick={() => setViewUser(null)} className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors">
                <X size={16} className="text-white" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                  {viewUser.avatar}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{viewUser.firstName} {viewUser.lastName}</h2>
                  <p className="text-blue-200 text-sm mt-0.5">{viewUser.jobTitle}</p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <RoleBadge hrRole={viewUser.hrRole} />
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[viewUser.status]?.pill ?? STATUS_STYLE.Active.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE[viewUser.status]?.dot ?? STATUS_STYLE.Active.dot}`} />
                      {viewUser.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Permission summary */}
            <div className="mx-6 mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5">Access Summary</p>
              <div className="space-y-1.5">
                {(SYSTEM_ROLES.find((r) => r.id === viewUser.hrRole)?.description ?? "—").split(". ").filter(Boolean).map((sentence, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ChevronRight size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600">{sentence}.</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-3">
              {[
                { icon: Hash,       label: "Employee ID",  value: viewUser.employeeId || "—" },
                { icon: Hash,       label: "ID Number",    value: viewUser.idNumber   || "—" },
                { icon: Mail,       label: "Email",        value: viewUser.email },
                { icon: Phone,      label: "Phone",        value: viewUser.phone || "—" },
                { icon: Building2,  label: "Department",   value: viewUser.department },
                { icon: Briefcase,  label: "Job Title",    value: viewUser.jobTitle  },
                { icon: ShieldCheck,label: "System Role",  value: hrRoleLabel(viewUser.hrRole) },
                { icon: Hash,       label: "Last Login",   value: viewUser.lastLogin },
                { icon: CalendarIcon, label: "Member Since", value: viewUser.createdAt },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4 p-3.5 bg-slate-50 rounded-2xl">
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

            {/* Drawer footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { openEdit(viewUser); setViewUser(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all"
                style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}
              >
                <Pencil size={14} /> Edit User
              </button>
              <button
                onClick={() => { setDeleteUser(viewUser); setViewUser(null); }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tiny inline calendar icon (avoids naming conflict)
function CalendarIcon({ size, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8"  y1="2" x2="8"  y2="6" />
      <line x1="3"  y1="10" x2="21" y2="10" />
    </svg>
  );
}
