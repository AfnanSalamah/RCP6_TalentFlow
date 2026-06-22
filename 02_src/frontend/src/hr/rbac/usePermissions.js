import { useAuth } from "../context/AuthContext";
import { PERMISSIONS, canRoleAccessRoute } from "./rbacConfig";

/**
 * Returns permission helpers scoped to the logged-in HR user's role.
 *
 * Usage:
 *   const { can, canAccessRoute, hrRole } = usePermissions();
 *   if (can('MANAGE_USERS')) { ... }
 *   if (canAccessRoute('/hr/settings')) { ... }
 */
export function usePermissions() {
  const { user } = useAuth();
  const hrRole = user?.hrRole ?? "admin";

  /** Returns true if the current role has the named feature permission. */
  function can(permission) {
    if (hrRole === "super_admin") return true; // platform owner — full control
    const allowed = PERMISSIONS[permission];
    if (!allowed) return false;
    return allowed.includes(hrRole);
  }

  /** Returns true if the current role may visit the given path. */
  function canAccessRoute(path) {
    if (hrRole === "super_admin") return true; // platform owner — full control
    return canRoleAccessRoute(hrRole, path);
  }

  /** Returns true if the current role is in the supplied list. */
  function hasRole(...roles) {
    return roles.includes(hrRole);
  }

  return { can, canAccessRoute, hasRole, hrRole };
}
