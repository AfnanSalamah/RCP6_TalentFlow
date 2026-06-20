import { api } from "./client";

// ─── Unified login ────────────────────────────────────────────────────────────
/**
 * Single entry point for all logins.
 *
 * Sends the identifier + password to the backend.
 * The backend searches HR users first, then applicants.
 * Returns the full response including:
 *   • access_token  – JWT to store
 *   • portal        – "hr" | "applicant"
 *   • redirect_to   – "/hr/dashboard" | "/user/dashboard"
 *   • user          – serialised user object
 *
 * The caller (LoginPage) stores the token under the correct key and
 * navigates to `redirect_to` — no client-side role guessing needed.
 */
export async function unifiedLogin(identifier, password) {
  // Note: we do NOT pass a tokenType here — this endpoint is public.
  return api.post("/auth/login", { identifier, password });
}

// ─── Company self-registration ────────────────────────────────────────────────
/**
 * registerCompany — public "Start Free Trial" signup.
 *
 * Creates a Company + its first Company Admin, then emails a 6-digit
 * verification code to the company email. Returns
 * { requires_verification, challenge_token, email, message, email_sent? } —
 * NO access token yet. The admin must confirm the code via
 * verifyCompanyEmail() before they are logged in.
 */
export async function registerCompany({ companyName, companyEmail, adminName, password, plan }) {
  return api.post("/auth/register-company", {
    company_name:  companyName,
    company_email: companyEmail,
    admin_name:    adminName,
    password,
    plan,
  });
}

/**
 * verifyCompanyEmail — confirm the 6-digit code sent on registration.
 * On success the backend activates the admin and returns the full HR session
 * { access_token, user, company, redirect_to }. Stores the HR token.
 */
export async function verifyCompanyEmail(challenge_token, code) {
  const data = await api.post("/auth/verify-company-email", { challenge_token, code });
  localStorage.setItem("tf_hr_token", data.access_token);
  return data;
}

/** resendCompanyVerification — request a fresh verification code. */
export async function resendCompanyVerification(challenge_token) {
  return api.post("/auth/resend-company-verification", { challenge_token, code: "" });
}

// ─── HR ──────────────────────────────────────────────────────────────────────

export async function hrLogin(identifier, password) {
  const data = await api.post("/auth/hr/login", { identifier, password }, "hr");
  localStorage.setItem("tf_hr_token", data.access_token);
  return data.user;
}

export async function hrMe() {
  return api.get("/auth/hr/me", "hr");
}

export function hrLogout() {
  localStorage.removeItem("tf_hr_token");
}

// ─── Applicant ────────────────────────────────────────────────────────────────

export async function applicantRegister(name, email, password) {
  // Returns { requires_verification, challenge_token, email, message } — no token yet
  return api.post("/auth/applicant/register", { name, email, password });
}

export async function applicantVerifyEmail(challenge_token, code) {
  const data = await api.post("/auth/applicant/verify-email", { challenge_token, code });
  localStorage.setItem("tf_user_token", data.access_token);
  return data.user;
}

export async function applicantResendVerification(challenge_token) {
  return api.post("/auth/applicant/resend-verification", { challenge_token, code: "" });
}

export async function applicantLogin(email, password) {
  const data = await api.post("/auth/applicant/login", { email, password }, "applicant");
  localStorage.setItem("tf_user_token", data.access_token);
  return data.user;
}

export async function applicantMe() {
  return api.get("/auth/applicant/me", "applicant");
}

export function applicantLogout() {
  localStorage.removeItem("tf_user_token");
}

export async function forgotPassword(email) {
  return api.post("/auth/applicant/forgot-password", { email });
}

export async function resetPassword(token, new_password) {
  return api.post("/auth/applicant/reset-password", { token, new_password });
}

export async function resetPasswordOtp(email, code, new_password, portal = "applicant") {
  const base = portal === "hr" ? "/auth/hr" : "/auth/applicant";
  return api.post(`${base}/reset-password-otp`, { email, code, new_password });
}

export async function forgotPasswordAny(email, portal = "applicant") {
  const base = portal === "hr" ? "/auth/hr" : "/auth/applicant";
  return api.post(`${base}/forgot-password`, { email });
}
