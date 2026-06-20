import {
  LayoutDashboard, Briefcase, ClipboardList, GitBranch, Users,
  FileText, CalendarCheck, Clock, Layers, Gift, ScrollText,
  Sparkles, BarChart2, UserCog, Shield, Settings, ClipboardCheck,
  BookOpen, MessageSquare,
} from "lucide-react";

// ── Role identifiers ──────────────────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN:       "admin",
  HR_MANAGER:  "hr_manager",
  INTERVIEWER: "interviewer",
};

export const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin:       "Admin",
  hr_manager:  "HR Manager",
  interviewer: "Interviewer",
};

export const ROLE_COLORS = {
  super_admin: { bg: "#EDE9FE", text: "#5B21B6", border: "#C4B5FD" },
  admin:       { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  hr_manager:  { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
  interviewer: { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
};

// ── Route-level permissions ───────────────────────────────────────────────────
// Maps path prefix → roles that may access it.
// More specific paths take precedence (sorted by length in canAccessRoute).
// NOTE: "super_admin" (the platform owner) is the top-level controller and is
// granted access to every route. It is added to each list below, and RoleRoute
// also short-circuits super_admin to allow-all as a defensive measure.
export const ROUTE_PERMISSIONS = {
  "/hr/dashboard":       ["super_admin", "admin", "hr_manager", "interviewer"],
  "/hr/projects":        ["super_admin", "admin", "hr_manager"],
  "/hr/roles":           ["super_admin", "admin", "hr_manager"],
  "/hr/candidates":      ["super_admin", "admin", "hr_manager", "interviewer"],
  "/hr/resume-center":   ["super_admin", "admin", "hr_manager", "interviewer"],
  "/hr/interviews":      ["super_admin", "admin", "hr_manager", "interviewer"],
  "/hr/scheduling":      ["super_admin", "admin", "hr_manager"],
  "/hr/pipeline":        ["super_admin", "admin", "hr_manager"],
  "/hr/talent-pool":     ["super_admin", "admin", "hr_manager"],
  "/hr/offer-generator": ["super_admin", "admin", "hr_manager"],
  "/hr/analytics":       ["super_admin", "admin", "hr_manager"],
  "/hr/contracts":       ["super_admin", "admin", "hr_manager"],
  "/hr/company-messages":["super_admin", "admin", "hr_manager"],
  "/hr/ai-assistant":    ["super_admin", "admin", "hr_manager"],
  "/hr/users":           ["super_admin", "admin"],
  "/hr/settings":        ["super_admin", "admin"],
  "/hr/profile":         ["super_admin", "admin", "hr_manager", "interviewer"],
  "/hr/directory":       ["super_admin", "admin", "hr_manager"],
};

export const ROLE_PERMISSION_STORAGE_KEY = "tf_hr_role_route_permissions";

export const ROLE_PERMISSION_MODULES = [
  { path: "/hr/dashboard", label: "Dashboard" },
  { path: "/hr/projects", label: "Projects" },
  { path: "/hr/roles", label: "Job Openings" },
  { path: "/hr/candidates", label: "Candidates" },
  { path: "/hr/resume-center", label: "Resume Center" },
  { path: "/hr/interviews", label: "Interviews" },
  { path: "/hr/scheduling", label: "Scheduling" },
  { path: "/hr/pipeline", label: "Pipeline" },
  { path: "/hr/talent-pool", label: "Talent Pool" },
  { path: "/hr/offer-generator", label: "Offers" },
  { path: "/hr/contracts", label: "Contracts" },
  { path: "/hr/company-messages", label: "Candidate Messages" },
  { path: "/hr/ai-assistant", label: "AI Assistant" },
  { path: "/hr/analytics", label: "Reports & Analytics" },
  { path: "/hr/directory", label: "Employee Directory" },
  { path: "/hr/users", label: "User Management" },
  { path: "/hr/settings", label: "Settings" },
];

export function getRoutePermissions() {
  if (typeof window === "undefined") return ROUTE_PERMISSIONS;
  try {
    const stored = JSON.parse(window.localStorage.getItem(ROLE_PERMISSION_STORAGE_KEY) || "{}");
    return { ...ROUTE_PERMISSIONS, ...stored };
  } catch {
    return ROUTE_PERMISSIONS;
  }
}

export function saveRoutePermissions(next) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLE_PERMISSION_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("tf:role-permissions-updated"));
}

export function canRoleAccessRoute(role, path) {
  if (role === "super_admin") return true;
  const permissions = getRoutePermissions();
  const matchingRoute = Object.keys(permissions)
    .filter((route) => path.startsWith(route))
    .sort((a, b) => b.length - a.length)[0];
  if (!matchingRoute) return true;
  return permissions[matchingRoute].includes(role);
}

// ── Feature-level permissions ─────────────────────────────────────────────────
export const PERMISSIONS = {
  // Job management
  CREATE_JOB:          ["admin", "hr_manager"],
  EDIT_JOB:            ["admin", "hr_manager"],
  DELETE_JOB:          ["admin"],

  // Candidate management
  MANAGE_CANDIDATES:   ["admin", "hr_manager"],
  VIEW_CANDIDATES:     ["admin", "hr_manager", "interviewer"],

  // Candidate profile tabs
  VIEW_OFFER_LETTER:   ["admin", "hr_manager"],
  VIEW_CONTRACT:       ["admin", "hr_manager"],
  VIEW_SALARY:         ["admin", "hr_manager"],

  // Interviews
  SCHEDULE_INTERVIEW:  ["admin", "hr_manager"],
  VIEW_INTERVIEWS:     ["admin", "hr_manager", "interviewer"],
  SUBMIT_EVALUATION:   ["admin", "hr_manager", "interviewer"],
  ADD_INTERVIEW_NOTES: ["admin", "hr_manager", "interviewer"],

  // Contracts & offers
  MANAGE_CONTRACTS:    ["admin", "hr_manager"],
  GENERATE_OFFER:      ["admin", "hr_manager"],

  // Reports & analytics
  VIEW_REPORTS:        ["admin", "hr_manager"],

  // AI features
  USE_AI:              ["admin", "hr_manager"],

  // Administration (admin only)
  MANAGE_USERS:        ["admin"],
  MANAGE_ROLES:        ["admin"],
  ACCESS_SETTINGS:     ["admin"],
  CONFIGURE_AI:        ["admin"],
};

// ── Navigation configuration ──────────────────────────────────────────────────

// Category dropdown nav (admin + hr_manager)
const CATEGORIES_ALL = [
  {
    id:     "hiring",
    label:  "Hiring",
    accent: "#2563EB",
    light:  "#EFF6FF",
    icon:   Briefcase,
    roles:  ["admin", "hr_manager"],
    items: [
      { to: "/hr/projects",   label: "Projects",     icon: Briefcase,     desc: "Manage hiring campaigns", roles: ["admin", "hr_manager"] },
      { to: "/hr/roles",      label: "Job Openings",  icon: ClipboardList, desc: "Define open positions",   roles: ["admin", "hr_manager"] },
      { to: "/hr/pipeline",   label: "Pipeline",     icon: GitBranch,     desc: "Track candidate stages",  roles: ["admin", "hr_manager"] },
      { to: "/hr/candidates", label: "Candidates",   icon: Users,         desc: "Browse all applicants",   roles: ["admin", "hr_manager"] },
      { to: "/hr/company-messages", label: "Candidate Messages", icon: MessageSquare, desc: "Reply to candidate messages", roles: ["admin", "hr_manager"] },
    ],
  },
  {
    id:     "evaluation",
    label:  "Evaluation",
    accent: "#0891B2",
    light:  "#ECFEFF",
    icon:   ClipboardList,
    roles:  ["admin", "hr_manager"],
    items: [
      { to: "/hr/resume-center", label: "Resume Center", icon: FileText,      desc: "Parse & review CVs",    roles: ["admin", "hr_manager"] },
      { to: "/hr/interviews",    label: "Interviews",    icon: CalendarCheck, desc: "Schedule & conduct",    roles: ["admin", "hr_manager"] },
      { to: "/hr/scheduling",    label: "Scheduling",    icon: Clock,         desc: "Coordinate time slots", roles: ["admin", "hr_manager"] },
    ],
  },
  {
    id:     "operations",
    label:  "Operations",
    accent: "#7C3AED",
    light:  "#F5F3FF",
    icon:   Layers,
    roles:  ["admin", "hr_manager"],
    items: [
      { to: "/hr/talent-pool",     label: "Talent Pool", icon: Layers,     desc: "Saved & passive talent", roles: ["admin", "hr_manager"] },
      { to: "/hr/offer-generator", label: "Offers",      icon: Gift,       desc: "Draft & send offers",    roles: ["admin", "hr_manager"] },
      { to: "/hr/contracts",       label: "Contracts",   icon: ScrollText, desc: "Manage agreements",      roles: ["admin", "hr_manager"] },
    ],
  },
  {
    id:     "core",
    label:  "Core",
    accent: "#059669",
    light:  "#ECFDF5",
    icon:   Sparkles,
    roles:  ["admin", "hr_manager"],
    items: [
      { to: "/hr/ai-assistant", label: "AI Assistant",       icon: Sparkles,  desc: "Smart hiring copilot",  roles: ["admin", "hr_manager"] },
      { to: "/hr/analytics",    label: "Reports & Analytics", icon: BarChart2, desc: "Insights & reports",   roles: ["admin", "hr_manager"] },
      { to: "/hr/directory",    label: "Employee Directory",  icon: BookOpen,  desc: "Browse HR members",    roles: ["hr_manager"] },
    ],
  },
  {
    id:     "admin_panel",
    label:  "Admin",
    accent: "#DC2626",
    light:  "#FEF2F2",
    icon:   Shield,
    roles:  ["admin"],
    items: [
      { to: "/hr/users",     label: "User Management",     icon: UserCog,  desc: "Manage team access",      roles: ["admin"] },
      { to: "/hr/directory", label: "Employee Directory",  icon: BookOpen, desc: "Browse all HR members",   roles: ["admin"] },
      { to: "/hr/settings",  label: "Settings",            icon: Settings, desc: "System configuration",   roles: ["admin"] },
    ],
  },
];

// Flat nav items for Interviewer
const INTERVIEWER_NAV_ITEMS = [
  { to: "/hr/dashboard",    label: "Dashboard",     icon: LayoutDashboard },
  { to: "/hr/interviews",   label: "My Interviews", icon: CalendarCheck   },
  { to: "/hr/candidates",   label: "Candidates",    icon: Users           },
  { to: "/hr/resume-center",label: "Evaluations",   icon: ClipboardCheck  },
];

/**
 * Returns the navigation structure for a given HR role.
 *
 * @param {string} role - "admin" | "hr_manager" | "interviewer"
 * @returns {{ type: "flat"|"categories", items?: [], categories?: [] }}
 */
export function getNavigationForRole(role) {
  // Super Admin sees the full admin navigation when inside the HR portal.
  if (role === "super_admin") role = "admin";

  if (role === "interviewer") {
    return { type: "flat", items: INTERVIEWER_NAV_ITEMS.filter((item) => canRoleAccessRoute(role, item.to)) };
  }

  const categories = CATEGORIES_ALL
    .filter((cat) => cat.roles.includes(role))
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => item.roles.includes(role) && canRoleAccessRoute(role, item.to)),
    }))
    .filter((cat) => cat.items.length > 0);

  return { type: "categories", categories };
}

// ── Demo credential mapping ───────────────────────────────────────────────────
// Employee ID prefix determines role — no database required.
// ADM-xxx → admin | HRM-xxx → hr_manager | INT-xxx → interviewer
//
// DEMO_CREDENTIALS is kept here for backward-compat imports.
// The authoritative source is DEMO_ACCOUNTS in employeeIdUtils.js.
export const DEMO_CREDENTIALS = [
  {
    employeeId:  "ADM-001",
    email:       "layla.rashidi@talentflow.ai",
    password:    "Admin@1234",
    hrRole:      "admin",
    displayName: "Layla Al-Rashidi",
    avatar:      "LA",
    title:       "Chief HR Officer",
  },
  {
    employeeId:  "HRM-001",
    email:       "omar.zahrani@talentflow.ai",
    password:    "HrMgr@123",
    hrRole:      "hr_manager",
    displayName: "Omar Al-Zahrani",
    avatar:      "OZ",
    title:       "HR Manager",
  },
  {
    employeeId:  "INT-001",
    email:       "khalid.ibrahim@talentflow.ai",
    password:    "Inter@123",
    hrRole:      "interviewer",
    displayName: "Khalid Ibrahim",
    avatar:      "KI",
    title:       "Technical Interviewer",
  },
];

/** Look up a demo account by Employee ID (case-insensitive). */
export function getDemoCredential(employeeId) {
  if (!employeeId) return null;
  const upper = employeeId.trim().toUpperCase();
  return DEMO_CREDENTIALS.find((d) => d.employeeId.toUpperCase() === upper) ?? null;
}
