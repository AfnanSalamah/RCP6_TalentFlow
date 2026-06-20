import { usePermissions } from "./usePermissions";

/**
 * Conditionally renders children based on the current user's RBAC permissions.
 *
 * Props (use one or both — both must pass):
 *   permission  {string}    – A key from PERMISSIONS (e.g. "MANAGE_USERS")
 *   roles       {string[]}  – An explicit list of allowed HR roles
 *   fallback    {ReactNode} – What to render when access is denied (default: null)
 *
 * Example:
 *   <PermissionGate permission="MANAGE_USERS">
 *     <UserManagementPanel />
 *   </PermissionGate>
 *
 *   <PermissionGate roles={["admin", "hr_manager"]} fallback={<p>No access</p>}>
 *     <ContractSection />
 *   </PermissionGate>
 */
export default function PermissionGate({ permission, roles, fallback = null, children }) {
  const { can, hrRole } = usePermissions();

  if (permission && !can(permission)) return fallback;
  if (roles && !roles.includes(hrRole)) return fallback;

  return children;
}
