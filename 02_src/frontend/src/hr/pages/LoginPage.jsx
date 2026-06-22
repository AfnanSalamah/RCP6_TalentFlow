/**
 * LoginPage.jsx
 *
 * Dual-mode auth page — login panel (/login) + register panel (/register).
 *
 * Auth flow
 * ─────────
 * LOGIN
 *   1. User submits identifier + password.
 *   2. POST /auth/login  (unified backend endpoint — searches HR then Applicants).
 *   3. Backend returns { portal, redirect_to, access_token, user }.
 *   4. If portal === "hr"        → inject session into HRAuthContext → /hr/dashboard
 *      If portal === "applicant" → store token + user → /user/dashboard
 *   No client-side regex or role guessing.
 *
 * REGISTER
 *   1. Form validates → POST /auth/applicant/register.
 *   2. Backend creates account, assigns role = 'Applicant', returns JWT.
 *   3. Store token + user → redirect immediately to /user/dashboard.
 */
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";       // HRAuthContext
import {
  Lock, User, Mail, X, ArrowLeft,
  Eye, EyeOff, ShieldCheck,
} from "lucide-react";
import logo from "../assets/logo.png";
import { unifiedLogin, applicantRegister } from "../../api/auth";
import { twoFactorApi } from "../../api/index";
import "./LoginPage.css";

// ── Small presentational components (defined outside — stable references) ────

function FormField({ label, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

function getStrength(password) {
  if (!password) return { level: 0, label: "", color: "", bar: "" };
  let score = 0;
  if (password.length >= 8)           score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password))  score++;
  if (score <= 1) return { level: 1, label: "Weak",   color: "#ef4444", bar: "#ef4444" };
  if (score <= 2) return { level: 2, label: "Medium", color: "#f97316", bar: "#f97316" };
  return           { level: 3, label: "Strong", color: "#22c55e", bar: "#22c55e" };
}

function StrengthBar({ password }) {
  const s = getStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3].map((seg) => (
          <div
            key={seg}
            style={{
              height: 5, flex: 1, borderRadius: 99, transition: "background 0.25s",
              background: s.level >= seg ? s.bar : "#e2e8f0",
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, color: s.color, margin: 0 }}>
        {s.label} password
        {s.level === 1 && " — add uppercase, numbers & symbols"}
        {s.level === 2 && " — add more variety to strengthen"}
        {s.level === 3 && " — great choice!"}
      </p>
    </div>
  );
}

function EyeToggle({ show, onToggle }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      style={{
        background: "none", border: "none", cursor: "pointer",
        padding: 0, color: "#49769F", flexShrink: 0, lineHeight: 0,
      }}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_UNAVAILABLE = "Email verification is temporarily unavailable. Please try again later.";

// ── Main component ────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate          = useNavigate();
  const location          = useLocation();
  const { setSession }    = useAuth();       // inject HR session without a second round-trip

  const isRegister = location.pathname === "/register";

  // ── Login form state ────────────────────────────────────────────────────────
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword,   setLoginPassword]   = useState("");
  const [showLoginPw,   setShowLoginPw]   = useState(false);
  const [loginError,    setLoginError]    = useState("");
  const [loginLoading,  setLoginLoading]  = useState(false);

  // ── 2FA modal state ─────────────────────────────────────────────────────────
  const [twoFaModal,     setTwoFaModal]     = useState(null);
  const [twoFaDigits,    setTwoFaDigits]    = useState(['','','','','','']);
  const [twoFaError,     setTwoFaError]     = useState('');
  const [twoFaLoading,   setTwoFaLoading]   = useState(false);
  const [twoFaShake,     setTwoFaShake]     = useState(false);
  const twoFaRefs = useRef([]);

  // ── Email verification modal state ──────────────────────────────────────────
  const [verifyModal,    setVerifyModal]    = useState(null);  // {challengeToken, email}
  const [verifyDigits,   setVerifyDigits]   = useState(['','','','','','']);
  const [verifyError,    setVerifyError]    = useState('');
  const [verifyLoading,  setVerifyLoading]  = useState(false);
  const [verifyResending, setVerifyResending] = useState(false);
  const [verifyShake,    setVerifyShake]    = useState(false);
  const [verifyTimer,    setVerifyTimer]    = useState(60);
  const [verifySuccess,  setVerifySuccess]  = useState(false);
  const verifyRefs = useRef([]);
  const verifyTimerRef = useRef(null);

  // ── Register form state ─────────────────────────────────────────────────────
  const [regName,       setRegName]       = useState("");
  const [regEmail,      setRegEmail]      = useState("");
  const [regPassword,   setRegPassword]   = useState("");
  const [regConfirm,    setRegConfirm]    = useState("");
  const [showRegPw,     setShowRegPw]     = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [regError,      setRegError]      = useState("");
  const [regLoading,    setRegLoading]    = useState(false);

  const passwordStrength = useMemo(() => getStrength(regPassword), [regPassword]);
  const passwordsMatch   = regPassword !== "" && regPassword === regConfirm;
  const passwordMismatch = regConfirm  !== "" && regPassword !== regConfirm;

  const regValid =
    regName.trim().length >= 2 &&
    EMAIL_REGEX.test(regEmail.trim()) &&
    regPassword.length >= 8 &&
    passwordStrength.level >= 2 &&
    passwordsMatch &&
    termsAccepted;

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleLogin() {
    setLoginError("");
    const identifier = loginIdentifier.trim();
    if (!identifier) { setLoginError("Please enter your Employee ID or Email address."); return; }
    if (!loginPassword) { setLoginError("Please enter your password."); return; }

    setLoginLoading(true);
    try {
      const data = await unifiedLogin(identifier, loginPassword);

      // Email not yet verified — show inline modal
      if (data.requires_verification) {
        _openVerifyModal(data);
        setLoginLoading(false);
        return;
      }

      // 2FA required
      if (data.requires_2fa) {
        // HR email OTP — use the same email verify modal used for applicants
        if (data.method === 'email' && data.portal === 'hr') {
          _openVerifyModal({ ...data, is_hr: true });
          setLoginLoading(false);
          return;
        }
        // Authenticator / legacy TOTP
        setTwoFaModal({
          challengeToken: data.challenge_token,
          portal: data.portal,
          method: data.method,
          setupSecret: data.setup_secret || '',
          setupUri: data.setup_uri || '',
          setupRequired: !!data.setup_required,
        });
        setLoginLoading(false);
        return;
      }

      _completeLogin(data);
    } catch (err) {
      setLoginError(err.message || "Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  function _completeLogin(finalData) {
    // Platform owner / Super Admin — route to the Super Admin portal.
    // The HR token doubles as the Super Admin token (backend accepts an
    // hr-typed token whose role is super_admin on all /super-admin/* routes).
    if (finalData.portal === "hr" && finalData.user?.hrRole === "super_admin") {
      localStorage.setItem("tf_sa_token", finalData.access_token);
      setSession(finalData.user, finalData.access_token);
      navigate("/super-admin/dashboard", { replace: true });
      return;
    }

    if (finalData.portal === "hr") {
      setSession(finalData.user, finalData.access_token);
    } else {
      localStorage.setItem("tf_user_token", finalData.access_token);
      localStorage.setItem("tf_user_data", JSON.stringify(finalData.user));
    }
    navigate(finalData.redirect_to || (finalData.portal === "hr" ? "/hr/dashboard" : "/user/dashboard"), { replace: true });
  }

  async function handleTwoFaSubmit(codeStr) {
    if (!twoFaModal) return;
    setTwoFaLoading(true);
    setTwoFaError('');
    try {
      const finalData = twoFaModal.portal === "hr"
        ? await twoFactorApi.verifyHr(twoFaModal.challengeToken, codeStr)
        : await twoFactorApi.verifyApplicant(twoFaModal.challengeToken, codeStr);
      finalData.portal = twoFaModal.portal;
      finalData.redirect_to = twoFaModal.portal === "hr" ? "/hr/dashboard" : "/user/dashboard";
      setTwoFaModal(null);
      _completeLogin(finalData);
    } catch (err) {
      setTwoFaError(err.message || "Invalid code. Please try again.");
      setTwoFaShake(true);
      setTimeout(() => {
        setTwoFaShake(false);
        setTwoFaDigits(['','','','','','']);
        twoFaRefs.current[0]?.focus();
      }, 700);
    } finally {
      setTwoFaLoading(false);
    }
  }

  function _openVerifyModal(data) {
    setVerifyModal({
      challengeToken: data.challenge_token,
      email: data.email || '',
      is_hr: !!data.is_hr,
    });
    setVerifyDigits(['','','','','','']);
    setVerifyError(data.email_sent === false ? (data.message || EMAIL_UNAVAILABLE) : '');
    setVerifySuccess(false);
    setVerifyTimer(60);
    clearInterval(verifyTimerRef.current);
    verifyTimerRef.current = setInterval(() => {
      setVerifyTimer(t => { if (t <= 1) { clearInterval(verifyTimerRef.current); return 0; } return t - 1; });
    }, 1000);
  }

  async function handleVerifySubmit(code) {
    if (!verifyModal) return;
    setVerifyLoading(true);
    setVerifyError('');
    try {
      let finalData;
      if (verifyModal.is_hr) {
        // HR email OTP — use HR verify endpoint
        finalData = await twoFactorApi.verifyHr(verifyModal.challengeToken, code);
        finalData.portal = 'hr';
        finalData.redirect_to = '/hr/dashboard';
      } else {
        const { applicantVerifyEmail } = await import('../../api/auth');
        const user = await applicantVerifyEmail(verifyModal.challengeToken, code);
        // applicantVerifyEmail stores token and returns user — navigate directly
        setVerifySuccess(true);
        clearInterval(verifyTimerRef.current);
        setTimeout(() => { setVerifyModal(null); navigate('/user/dashboard', { replace: true }); }, 1800);
        return;
      }
      setVerifySuccess(true);
      clearInterval(verifyTimerRef.current);
      setTimeout(() => {
        setVerifyModal(null);
        _completeLogin(finalData);
      }, 1800);
    } catch (err) {
      setVerifyError(err.message || 'Invalid code. Please try again.');
      setVerifyShake(true);
      setTimeout(() => {
        setVerifyShake(false);
        setVerifyDigits(['','','','','','']);
        verifyRefs.current[0]?.focus();
      }, 700);
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleVerifyResend() {
    if (!verifyModal) return;
    setVerifyResending(true);
    try {
      let res;
      if (verifyModal.is_hr) {
        // Re-trigger HR login to get a new OTP
        const { unifiedLogin: ul } = await import('../../api/auth');
        res = await ul(loginIdentifier.trim(), loginPassword);
        if (res.requires_2fa) {
          setVerifyModal(m => ({ ...m, challengeToken: res.challenge_token }));
        }
      } else {
        const { applicantResendVerification } = await import('../../api/auth');
        res = await applicantResendVerification(verifyModal.challengeToken);
        setVerifyModal(m => ({ ...m, challengeToken: res.challenge_token }));
      }
      setVerifyTimer(60);
      setVerifyDigits(['','','','','','']);
      setVerifyError(res?.email_sent === false ? (res?.message || EMAIL_UNAVAILABLE) : '');
      clearInterval(verifyTimerRef.current);
      verifyTimerRef.current = setInterval(() => {
        setVerifyTimer(t => { if (t <= 1) { clearInterval(verifyTimerRef.current); return 0; } return t - 1; });
      }, 1000);
      verifyRefs.current[0]?.focus();
    } catch (err) {
      setVerifyError(EMAIL_UNAVAILABLE);
    } finally {
      setVerifyResending(false);
    }
  }

  /**
   * handleRegister
   *
   * POST /auth/applicant/register → receives { access_token, user }
   * The backend assigns role = "Applicant" automatically.
   * We store the token then redirect straight to the Applicant Dashboard.
   */
  async function handleRegister() {
    setRegError("");
    if (!regValid) return;
    setRegLoading(true);
    try {
      const res = await applicantRegister(
        regName.trim(),
        regEmail.trim().toLowerCase(),
        regPassword,
      );
      // Backend returns { requires_verification, challenge_token, email }
      if (res.requires_verification) {
        _openVerifyModal({ ...res, email: res.email || regEmail.trim().toLowerCase() });
      } else {
        // Fallback: old-style direct token (shouldn't happen with new backend)
        localStorage.setItem("tf_user_token", res.access_token);
        localStorage.setItem("tf_user_data", JSON.stringify(res.user));
        navigate("/user/dashboard", { replace: true });
      }
    } catch (err) {
      setRegError(err.message || "Registration failed. Please try again.");
    } finally {
      setRegLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="login-scene">
      <div className="scene-layer layer-one" />
      <div className="scene-layer layer-two" />
      <div className="scene-layer layer-three" />

      <div className={`auth-container ${isRegister ? "active" : ""}`}>

        {/* Back Home — SPA navigation, NOT an <a href> */}
        <button
          type="button"
          className="back-home"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={17} /> Back Home
        </button>

        {/* Close — same */}
        <button
          type="button"
          className="login-close"
          onClick={() => navigate("/")}
        >
          <X size={18} />
        </button>

        {/* ════════════════════════════ LOGIN PANEL */}
        <div className="form-panel login-panel">
          <img src={logo} alt="TalentFlow" className="login-logo" />
          <h1>Login</h1>
          <p className="auth-desc">
            Access your TalentFlow workspace and manage recruitment efficiently.
          </p>

          {/* Unified identifier — Employee ID or Candidate Email ──────── */}
          <FormField label="Email">
            <div className="field-box">
              <User size={18} />
              <input
                type="text"
                placeholder="Enter your email or Employee ID"
                value={loginIdentifier}
                onChange={(e) => {
                  setLoginIdentifier(e.target.value);
                  setLoginError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </FormField>

          {/* Password ───────────────────────────────────────────────────── */}
          <FormField label="Password">
            <div className="field-box">
              <Lock size={18} />
              <input
                type={showLoginPw ? "text" : "password"}
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value);
                  setLoginError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                autoComplete="current-password"
              />
              <EyeToggle show={showLoginPw} onToggle={() => setShowLoginPw((v) => !v)} />
            </div>
          </FormField>

          {/* Error banner ───────────────────────────────────────────────── */}
          {loginError && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, background: "#FEF2F2",
              border: "1px solid #FECACA", marginBottom: 4,
            }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#DC2626" }}>
                {loginError}
              </p>
            </div>
          )}

          <div className="login-options">
            <label><input type="checkbox" /> Remember me</label>
            <span
              style={{ cursor: "pointer", color: "#2563EB", fontWeight: 600 }}
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </span>
          </div>

          {/* type="button" prevents accidental form submission */}
          <button
            type="button"
            className="login-btn"
            onClick={handleLogin}
            disabled={loginLoading}
          >
            {loginLoading ? "Logging in…" : "Login"}
          </button>

        </div>

        {/* ════════════════════════════ REGISTER PANEL */}
        <div className="form-panel register-panel">

          {/* Sticky header */}
          <div className="register-header">
            <img src={logo} alt="TalentFlow" className="login-logo" />
            <h1>Register</h1>
            <p className="auth-desc">
              Create your TalentFlow account and start your hiring journey.
            </p>
          </div>

          {/* Scrollable body */}
          <div className="register-scroll-body">

            {/* Full Name */}
            <FormField label="Full Name">
              <div className="field-box">
                <User size={18} />
                <input
                  tabIndex={1}
                  type="text"
                  placeholder="Enter your full name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>
            </FormField>

            {/* Email — uses Mail icon (imported above) */}
            <FormField label="Email">
              <div className="field-box">
                <Mail size={18} />
                <input
                  tabIndex={2}
                  type="email"
                  placeholder="you@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
            </FormField>

            {/* Password + strength */}
            <FormField label="Password">
              <div className="field-box">
                <Lock size={18} />
                <input
                  tabIndex={3}
                  type={showRegPw ? "text" : "password"}
                  placeholder="Create a password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
                <EyeToggle show={showRegPw} onToggle={() => setShowRegPw((v) => !v)} />
              </div>
              <StrengthBar password={regPassword} />
            </FormField>

            {/* Confirm Password */}
            <FormField label="Confirm Password">
              <div className="field-box">
                <ShieldCheck size={18} />
                <input
                  tabIndex={4}
                  type={showConfirmPw ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                />
                <EyeToggle
                  show={showConfirmPw}
                  onToggle={() => setShowConfirmPw((v) => !v)}
                />
              </div>
              {passwordMismatch && (
                <p style={{ color: "#ef4444", fontSize: 11, fontWeight: 700, margin: "4px 0 0" }}>
                  Passwords do not match
                </p>
              )}
              {passwordsMatch && (
                <p style={{ color: "#22c55e", fontSize: 11, fontWeight: 700, margin: "4px 0 0" }}>
                  ✓ Passwords match
                </p>
              )}
            </FormField>

            {/* Terms & Conditions */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, margin: "10px 0 14px" }}>
              <input
                id="reg-terms"
                tabIndex={5}
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{
                  width: 16, height: 16, marginTop: 2,
                  accentColor: "#0A4174", cursor: "pointer", flexShrink: 0,
                }}
              />
              <label
                htmlFor="reg-terms"
                style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, cursor: "pointer", userSelect: "none" }}
              >
                I agree to the{" "}
                {/* e.preventDefault() stops <a href="#"> from scrolling to top */}
                <a
                  href="#terms"
                  onClick={(e) => e.preventDefault()}
                  style={{ color: "#2563EB", fontWeight: 700, textDecoration: "underline" }}
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#privacy"
                  onClick={(e) => e.preventDefault()}
                  style={{ color: "#2563EB", fontWeight: 700, textDecoration: "underline" }}
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Register error */}
            {regError && (
              <div style={{
                padding: "10px 14px", borderRadius: 10, background: "#FEF2F2",
                border: "1px solid #FECACA", marginBottom: 8,
              }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#DC2626" }}>
                  {regError}
                </p>
              </div>
            )}

            {/* Create Account button */}
            <button
              type="button"
              tabIndex={6}
              onClick={handleRegister}
              disabled={!regValid}
              style={{
                width: "100%", height: 50, border: "none", borderRadius: 16,
                fontSize: 15, fontWeight: 800,
                cursor: regValid ? "pointer" : "not-allowed",
                transition: "all 0.25s ease",
                background: regValid
                  ? "linear-gradient(135deg,#001d39,#0a4174)"
                  : "#e2e8f0",
                color: regValid ? "#fff" : "#94a3b8",
                opacity: regValid ? 1 : 0.75,
                boxShadow: regValid ? "0 12px 32px rgba(0,29,57,0.28)" : "none",
                marginBottom: 4,
              }}
              onMouseEnter={(e) => {
                if (regValid) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 18px 42px rgba(0,29,57,0.38)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = regValid
                  ? "0 12px 32px rgba(0,29,57,0.28)"
                  : "none";
              }}
            >
              {regLoading ? "Creating account…" : regValid ? "Create Account →" : "Complete all fields to continue"}
            </button>

          </div>{/* /register-scroll-body */}
        </div>{/* /register-panel */}

        {/* ════════════════════════════ TOGGLE PANEL
            Toggle buttons use navigate() — NOT setIsRegister().
            This keeps the URL in sync with the visible panel so that:
              • refreshing the page shows the correct form
              • the browser back/forward buttons work as expected
              • sharing the URL opens the right panel for the recipient
        */}
        <div className="toggle-panel">
          <div className="toggle-content login-message">
            <h2>Hello, Talent!</h2>
            <p>Don't have an account yet?</p>
            <button
              type="button"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
          </div>
          <div className="toggle-content register-message">
            <h2>Welcome Back!</h2>
            <p>Already have an account?</p>
            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        </div>

      </div>

      {/* ── Email Verification Modal ──────────────────────────────────────── */}
      {verifyModal && (
        <VerifyEmailModal
          modal={verifyModal}
          digits={verifyDigits}
          setDigits={setVerifyDigits}
          inputRefs={verifyRefs}
          error={verifyError}
          setError={setVerifyError}
          loading={verifyLoading}
          shake={verifyShake}
          success={verifySuccess}
          timer={verifyTimer}
          resending={verifyResending}
          onSubmit={handleVerifySubmit}
          onResend={handleVerifyResend}
          onClose={() => { setVerifyModal(null); clearInterval(verifyTimerRef.current); }}
        />
      )}

      {/* ── Inline 2FA Modal ──────────────────────────────────────────────── */}
      {twoFaModal && (
        <TwoFaModal
          modal={twoFaModal}
          digits={twoFaDigits}
          setDigits={setTwoFaDigits}
          inputRefs={twoFaRefs}
          error={twoFaError}
          setError={setTwoFaError}
          loading={twoFaLoading}
          shake={twoFaShake}
          onSubmit={handleTwoFaSubmit}
          onClose={() => setTwoFaModal(null)}
        />
      )}
    </div>
  );
}

// ── 2FA Modal Component ───────────────────────────────────────────────────────

function TwoFaModal({ modal, digits, setDigits, inputRefs, error, setError, loading, shake, onSubmit, onClose }) {
  const fullCode = digits.join('');

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleChange = (i, val) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    setError('');
    if (clean && i < 5) inputRefs.current[i + 1]?.focus();
    if (clean && i === 5) {
      const code = next.join('');
      if (code.length === 6) onSubmit(code);
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) { const n = [...digits]; n[i] = ''; setDigits(n); }
      else if (i > 0) inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!p) return;
    const next = [...p.split(''), ...Array(6 - p.length).fill('')];
    setDigits(next);
    if (p.length === 6) { inputRefs.current[5]?.focus(); onSubmit(p); }
    else inputRefs.current[p.length]?.focus();
  };

  const isAuthenticator = modal.method === 'authenticator';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        position: 'relative',
        background: '#fff', borderRadius: 22, padding: '40px 36px', maxWidth: 440, width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`
          @keyframes popIn{0%{transform:scale(0.88);opacity:0}100%{transform:scale(1);opacity:1}}
          @keyframes shake2{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}
          @keyframes spin2{to{transform:rotate(360deg)}}
          .tfa-box:focus{outline:none;border-color:#0A4174 !important;box-shadow:0 0 0 3px #7BBDE844 !important}
        `}</style>

        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}>
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#EFF6FF', border: '2px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0A4174" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Two-Step Verification
          </h2>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>
            {isAuthenticator
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Enter the 6-digit code sent to your email'}
          </p>

          {/* First-time setup instructions */}
          {modal.setupRequired && modal.setupSecret && (
            <div style={{ marginTop: 12, padding: '14px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, textAlign: 'left' }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#92400E' }}>
                First-time setup — add this key to your authenticator app:
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFF', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 12px' }}>
                <code style={{ flex: 1, fontSize: 13, fontWeight: 800, color: '#C2410C', letterSpacing: '0.05em', wordBreak: 'break-all' }}>
                  {modal.setupSecret}
                </code>
                <button
                  onClick={() => navigator.clipboard?.writeText(modal.setupSecret)}
                  title="Copy key"
                  style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#92400E' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
              </div>
              {modal.setupUri && (
                <a
                  href={modal.setupUri}
                  style={{ display: 'block', marginTop: 8, fontSize: 12, color: '#0A4174', fontWeight: 600, textDecoration: 'underline' }}
                >
                  → Open in Google Authenticator / Authy
                </a>
              )}
              <p style={{ margin: '8px 0 0', fontSize: 11, color: '#78716C' }}>
                Apps: Google Authenticator, Microsoft Authenticator, Authy — or any TOTP app.
              </p>
            </div>
          )}

          {/* Returning user — just show key for reference */}
          {!modal.setupRequired && modal.setupSecret && (
            <div style={{ marginTop: 10, padding: '8px 14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, fontSize: 12, color: '#C2410C', fontWeight: 600, wordBreak: 'break-all' }}>
              Setup key: {modal.setupSecret}
            </div>
          )}

        </div>

        {/* Digit boxes */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20, animation: shake ? 'shake2 0.5s ease' : 'none' }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => inputRefs.current[i] = el}
              className="tfa-box"
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              disabled={loading}
              style={{
                width: 48, height: 58, textAlign: 'center',
                fontSize: 24, fontWeight: 800, color: error ? '#DC2626' : '#0A4174',
                border: `2px solid ${error ? '#FCA5A5' : d ? '#0A4174' : '#E2E8F0'}`,
                borderRadius: 12, background: d ? '#EFF6FF' : '#F8FAFC',
                transition: 'all 0.15s', cursor: 'text',
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 16, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#DC2626' }}>{error}</p>
          </div>
        )}

        <button
          onClick={() => fullCode.length === 6 && onSubmit(fullCode)}
          disabled={fullCode.length < 6 || loading}
          style={{
            width: '100%', height: 50, borderRadius: 12, border: 'none',
            fontSize: 15, fontWeight: 800, cursor: fullCode.length < 6 ? 'not-allowed' : 'pointer',
            background: fullCode.length === 6 ? 'linear-gradient(135deg,#001D39,#0A4174)' : '#E2E8F0',
            color: fullCode.length === 6 ? '#fff' : '#94A3B8',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? (
            <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin2 0.65s linear infinite' }} />Verifying…</>
          ) : 'Verify →'}
        </button>
      </div>
    </div>
  );
}

// ── Email Verification Modal ──────────────────────────────────────────────────

function VerifyEmailModal({ modal, digits, setDigits, inputRefs, error, setError, loading, shake, success, timer, resending, onSubmit, onResend, onClose }) {
  const fullCode = digits.join('');

  useEffect(() => {
    if (!success) setTimeout(() => inputRefs.current[0]?.focus(), 80);
  }, [success]);

  const handleChange = (i, val) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    setError('');
    if (clean && i < 5) inputRefs.current[i + 1]?.focus();
    if (clean && i === 5 && next.join('').length === 6) onSubmit(next.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) { const n = [...digits]; n[i] = ''; setDigits(n); }
      else if (i > 0) inputRefs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!p) return;
    const next = [...p.split(''), ...Array(6 - p.length).fill('')];
    setDigits(next);
    if (p.length === 6) { inputRefs.current[5]?.focus(); onSubmit(p); }
    else inputRefs.current[p.length]?.focus();
  };

  // Mask email for display: abc***@gmail.com
  const maskedEmail = modal.email
    ? modal.email.replace(/^(.{2})(.+?)(@.+)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 4)) + c)
    : '';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        position: 'relative',
        background: '#fff', borderRadius: 24, padding: '44px 40px 36px',
        maxWidth: 440, width: '100%',
        boxShadow: '0 40px 100px rgba(0,29,57,0.35)',
        animation: 'verifyPop 0.28s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`
          @keyframes verifyPop{0%{transform:scale(0.86) translateY(20px);opacity:0}100%{transform:scale(1) translateY(0);opacity:1}}
          @keyframes vshake{0%,100%{transform:translateX(0)}20%{transform:translateX(-9px)}40%{transform:translateX(9px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}
          @keyframes vspin{to{transform:rotate(360deg)}}
          @keyframes checkDraw{0%{stroke-dashoffset:60}100%{stroke-dashoffset:0}}
          @keyframes successPulse{0%{transform:scale(0.8);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
          .vbox:focus{outline:none;border-color:#0A4174 !important;box-shadow:0 0 0 3px rgba(123,189,232,0.3) !important}
        `}</style>

        {/* Close button */}
        <button onClick={onClose} disabled={loading} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 6, borderRadius: 8,
        }}>
          <X size={18} />
        </button>

        {success ? (
          /* ── Success state ── */
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#001D39,#0A4174)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'successPulse 0.5s ease' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" strokeDasharray="60" strokeDashoffset="0" style={{ animation: 'checkDraw 0.45s ease 0.1s both' }} />
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>Email Verified!</h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>Your account is confirmed. Redirecting to your dashboard…</p>
          </div>
        ) : (
          /* ── Verify state ── */
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              {/* Icon */}
              <div style={{
                width: 68, height: 68, borderRadius: '50%',
                background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                border: '2px solid #BFDBFE',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A4174" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                Verify your email
              </h2>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.65, margin: 0 }}>
                We sent a 6-digit code to<br />
                <strong style={{ color: '#0A4174' }}>{maskedEmail}</strong>
              </p>
            </div>

            {/* OTP digit boxes */}
            <div style={{
              display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20,
              animation: shake ? 'vshake 0.5s ease' : 'none',
            }}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  className="vbox"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  disabled={loading}
                  style={{
                    width: 50, height: 60, textAlign: 'center',
                    fontSize: 26, fontWeight: 900,
                    color: error ? '#DC2626' : '#001D39',
                    border: `2px solid ${error ? '#FCA5A5' : d ? '#0A4174' : '#E2E8F0'}`,
                    borderRadius: 14, background: d ? '#EFF6FF' : '#F8FAFC',
                    transition: 'all 0.15s', cursor: 'text',
                  }}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 16, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#DC2626' }}>{error}</p>
              </div>
            )}

            {/* Verify button */}
            <button
              onClick={() => fullCode.length === 6 && onSubmit(fullCode)}
              disabled={fullCode.length < 6 || loading}
              style={{
                width: '100%', height: 52, borderRadius: 14, border: 'none', marginBottom: 16,
                fontSize: 15, fontWeight: 800, cursor: fullCode.length < 6 ? 'not-allowed' : 'pointer',
                background: fullCode.length === 6
                  ? 'linear-gradient(135deg,#001D39,#0A4174)'
                  : '#E2E8F0',
                color: fullCode.length === 6 ? '#fff' : '#94A3B8',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
                boxShadow: fullCode.length === 6 ? '0 8px 24px rgba(0,29,57,0.25)' : 'none',
              }}
            >
              {loading
                ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'vspin 0.65s linear infinite' }} />Verifying…</>
                : 'Verify Email →'
              }
            </button>

            {/* Resend */}
            <div style={{ textAlign: 'center' }}>
              {timer > 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>
                  Resend code in <strong style={{ color: '#0A4174' }}>{timer}s</strong>
                </p>
              ) : (
                <button
                  onClick={onResend}
                  disabled={resending}
                  style={{ background: 'none', border: 'none', cursor: resending ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, color: '#0A4174', textDecoration: 'underline', opacity: resending ? 0.65 : 1 }}
                >
                  {resending ? 'Sending...' : 'Resend verification code'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
