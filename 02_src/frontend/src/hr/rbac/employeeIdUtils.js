/**
 * employeeIdUtils.js
 *
 * Role detection from Employee ID prefixes — no database required.
 *
 * Prefix rules:
 *   ADM-xxx  →  admin
 *   HRM-xxx  →  hr_manager
 *   INT-xxx  →  interviewer
 *
 * Public API:
 *   getRoleFromEmployeeId(id)   → "admin" | "hr_manager" | "interviewer" | null
 *   isValidEmployeeId(id)       → boolean
 *   parseEmployeeId(id)         → { prefix, number, hrRole } | null
 *   findEmployeeById(id)        → employee object | null
 *   generateEmployeeId(hrRole, existingUsers) → "ADM-004" etc.
 */

// ── Prefix → role map ─────────────────────────────────────────────────────────
const PREFIX_TO_ROLE = {
  ADM: "admin",
  HRM: "hr_manager",
  INT: "interviewer",
};

// ── Role → prefix map (reverse) ───────────────────────────────────────────────
export const ROLE_TO_PREFIX = {
  admin:       "ADM",
  hr_manager:  "HRM",
  interviewer: "INT",
};

// ── Valid ID pattern ───────────────────────────────────────────────────────────
const EMPLOYEE_ID_PATTERN = /^(ADM|HRM|INT)-(\d{3,})$/i;

// ─────────────────────────────────────────────────────────────────────────────
/**
 * getRoleFromEmployeeId
 *
 * Extracts the role from an Employee ID prefix.
 *
 * @param   {string} employeeId  e.g. "ADM-001", "hrm-003", "INT-007"
 * @returns {"admin"|"hr_manager"|"interviewer"|null}
 *
 * @example
 *   getRoleFromEmployeeId("ADM-001")  // "admin"
 *   getRoleFromEmployeeId("HRM-003")  // "hr_manager"
 *   getRoleFromEmployeeId("INT-001")  // "interviewer"
 *   getRoleFromEmployeeId("XYZ-999")  // null
 */
export function getRoleFromEmployeeId(employeeId) {
  if (!employeeId || typeof employeeId !== "string") return null;
  const upper = employeeId.trim().toUpperCase();
  const match = upper.match(EMPLOYEE_ID_PATTERN);
  if (!match) return null;
  return PREFIX_TO_ROLE[match[1]] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * isValidEmployeeId
 *
 * Returns true if the string is a well-formed Employee ID.
 *
 * @param   {string} employeeId
 * @returns {boolean}
 */
export function isValidEmployeeId(employeeId) {
  if (!employeeId || typeof employeeId !== "string") return false;
  return EMPLOYEE_ID_PATTERN.test(employeeId.trim());
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * parseEmployeeId
 *
 * Deconstructs an Employee ID into its parts.
 *
 * @param   {string} employeeId
 * @returns {{ raw: string, prefix: string, number: string, hrRole: string } | null}
 *
 * @example
 *   parseEmployeeId("HRM-007")
 *   // { raw: "HRM-007", prefix: "HRM", number: "007", hrRole: "hr_manager" }
 */
export function parseEmployeeId(employeeId) {
  if (!isValidEmployeeId(employeeId)) return null;
  const upper  = employeeId.trim().toUpperCase();
  const match  = upper.match(EMPLOYEE_ID_PATTERN);
  const prefix = match[1];
  const number = match[2];
  return {
    raw:    upper,
    prefix,
    number,
    hrRole: PREFIX_TO_ROLE[prefix],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * generateEmployeeId
 *
 * Auto-generates the next sequential Employee ID for a given role,
 * based on the IDs already present in the users list.
 *
 * @param   {string}   hrRole        "admin" | "hr_manager" | "interviewer"
 * @param   {Array}    existingUsers  Array of user objects with .employeeId
 * @returns {string}                 e.g. "ADM-004"
 *
 * @example
 *   generateEmployeeId("admin", users)         // "ADM-002" (if ADM-001 exists)
 *   generateEmployeeId("interviewer", users)   // "INT-004"
 */
export function generateEmployeeId(hrRole, existingUsers = []) {
  const prefix  = ROLE_TO_PREFIX[hrRole] ?? "EMP";
  const pattern = new RegExp(`^${prefix}-(\\d+)$`, "i");

  const usedNumbers = existingUsers
    .map((u) => {
      const m = (u.employeeId ?? "").match(pattern);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const next = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * EMPLOYEE_REGISTRY
 *
 * Local mock data — single source of truth for HR staff lookup.
 * In production this would be replaced by an API call.
 *
 * Each entry mirrors a row in initialUsers plus a mock password.
 * Password rules: min 8 chars, uppercase, number, symbol.
 */
export const EMPLOYEE_REGISTRY = [
  // ── Admins ───────────────────────────────────────────────────────────────
  {
    employeeId: "ADM-001",
    idNumber:   "1098765432",
    name:       "Layla Al-Rashidi",
    email:      "layla.rashidi@talentflow.ai",
    avatar:     "LA",
    department: "Human Resources",
    jobTitle:   "Chief HR Officer",
    password:   "Admin@1234",
    hrRole:     "admin",
  },

  // ── HR Managers ───────────────────────────────────────────────────────────
  {
    employeeId: "HRM-001",
    idNumber:   "1034512678",
    name:       "Omar Al-Zahrani",
    email:      "omar.zahrani@talentflow.ai",
    avatar:     "OZ",
    department: "Human Resources",
    jobTitle:   "HR Manager",
    password:   "HrMgr@123",
    hrRole:     "hr_manager",
  },
  {
    employeeId: "HRM-002",
    idNumber:   "1056789012",
    name:       "Sara Al-Otaibi",
    email:      "sara.otaibi@talentflow.ai",
    avatar:     "SO",
    department: "Human Resources",
    jobTitle:   "Senior Recruiter",
    password:   "HrMgr@123",
    hrRole:     "hr_manager",
  },
  {
    employeeId: "HRM-003",
    idNumber:   "1023456789",
    name:       "Nora Al-Qahtani",
    email:      "nora.qahtani@talentflow.ai",
    avatar:     "NQ",
    department: "Human Resources",
    jobTitle:   "Talent Acquisition Specialist",
    password:   "HrMgr@123",
    hrRole:     "hr_manager",
  },
  {
    employeeId: "HRM-004",
    idNumber:   "1045678923",
    name:       "Faris Al-Dosari",
    email:      "faris.dosari@talentflow.ai",
    avatar:     "FD",
    department: "Finance",
    jobTitle:   "Finance Recruiter",
    password:   "HrMgr@123",
    hrRole:     "hr_manager",
  },
  {
    employeeId: "HRM-005",
    idNumber:   "1067891234",
    name:       "Rania El-Masri",
    email:      "rania.masri@talentflow.ai",
    avatar:     "RE",
    department: "Operations",
    jobTitle:   "HR Coordinator",
    password:   "HrMgr@123",
    hrRole:     "hr_manager",
  },
  {
    employeeId: "HRM-006",
    idNumber:   "1089012345",
    name:       "Yasser Al-Ghamdi",
    email:      "yasser.ghamdi@talentflow.ai",
    avatar:     "YG",
    department: "Technology",
    jobTitle:   "HR Manager – Tech",
    password:   "HrMgr@123",
    hrRole:     "hr_manager",
  },

  // ── Interviewers ──────────────────────────────────────────────────────────
  {
    employeeId: "INT-001",
    idNumber:   "1078234561",
    name:       "Khalid Ibrahim",
    email:      "khalid.ibrahim@talentflow.ai",
    avatar:     "KI",
    department: "Technology",
    jobTitle:   "Technical Interviewer",
    password:   "Inter@123",
    hrRole:     "interviewer",
  },
  {
    employeeId: "INT-002",
    idNumber:   "1012345678",
    name:       "Hana Al-Zubaidi",
    email:      "hana.zubaidi@talentflow.ai",
    avatar:     "HZ",
    department: "Marketing",
    jobTitle:   "Employer Branding",
    password:   "Inter@123",
    hrRole:     "interviewer",
  },
  {
    employeeId: "INT-003",
    idNumber:   "1090123456",
    name:       "Tariq Al-Malki",
    email:      "tariq.malki@talentflow.ai",
    avatar:     "TM",
    department: "Legal",
    jobTitle:   "Legal HR Advisor",
    password:   "Inter@123",
    hrRole:     "interviewer",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
/**
 * findEmployeeById
 *
 * Looks up an employee in the local registry by Employee ID (case-insensitive).
 *
 * @param   {string} employeeId
 * @returns {object|null}  Employee record or null if not found
 */
export function findEmployeeById(employeeId) {
  if (!employeeId) return null;
  const upper = employeeId.trim().toUpperCase();
  return EMPLOYEE_REGISTRY.find((e) => e.employeeId.toUpperCase() === upper) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * findEmployeeByIdNumber
 *
 * Looks up a staff member by their national ID number.
 *
 * @param   {string} idNumber  e.g. "1098765432"
 * @returns {object|null}      Employee record or null if not found
 */
export function findEmployeeByIdNumber(idNumber) {
  if (!idNumber) return null;
  const normalized = idNumber.trim();
  return EMPLOYEE_REGISTRY.find((e) => e.idNumber === normalized) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * buildAuthUserFromEmployee
 *
 * Converts a registry record into the shape stored in AuthContext.
 *
 * @param   {object} employee  Record from EMPLOYEE_REGISTRY
 * @returns {object}           AuthContext user payload
 */
export function buildAuthUserFromEmployee(employee) {
  return {
    name:       employee.name,
    email:      employee.email,
    employeeId: employee.employeeId,
    avatar:     employee.avatar,
    role:       "hr",
    hrRole:     employee.hrRole,
  };
}

// ── Convenience re-exports for demo login panel ───────────────────────────────
/** The three canonical demo accounts shown on the login screen. */
export const DEMO_ACCOUNTS = [
  EMPLOYEE_REGISTRY[0],   // ADM-001 — Admin
  EMPLOYEE_REGISTRY[1],   // HRM-001 — HR Manager
  EMPLOYEE_REGISTRY[6],   // INT-001 — Interviewer
];
