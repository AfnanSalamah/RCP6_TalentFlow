// ── RBAC roles (maps to hrRole in AuthContext / rbacConfig) ──────────────────
// These are the canonical system roles used for permissions and navigation.
export const SYSTEM_ROLES = [
  {
    id:    "admin",
    label: "Admin",
    description:
      "Full system access including settings, user management, permissions, reports, and platform configuration.",
  },
  {
    id:    "hr_manager",
    label: "HR Manager",
    description:
      "Access to recruitment, candidates, jobs, interviews, contracts, and reports. No access to system settings or user management.",
  },
  {
    id:    "interviewer",
    label: "Interviewer",
    description:
      "Access only to assigned interviews, candidate resumes, AI screening results, and evaluation forms.",
  },
];

// Helper: derive display label from hrRole
export function hrRoleLabel(hrRole) {
  return SYSTEM_ROLES.find((r) => r.id === hrRole)?.label ?? hrRole;
}

// Legacy role list kept for filter dropdowns / backward compat
export const ROLES = ["Admin", "HR Manager", "Interviewer"];

export const DEPARTMENTS = [
  "Human Resources",
  "Technology",
  "Finance",
  "Operations",
  "Marketing",
  "Legal",
];
export const STATUSES = ["Active", "Inactive", "Suspended"];

export const initialUsers = [];

