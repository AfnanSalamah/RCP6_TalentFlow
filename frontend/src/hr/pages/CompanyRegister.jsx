/**
 * CompanyRegister.jsx — public "Start Free Trial" company signup.
 *
 * Flow:
 *   1. Collect Company Name, Company Email, Admin Name, Password, Plan.
 *   2. POST /auth/register-company  → creates Company + Company Admin, returns
 *      an HR access token (auto-login) and the new company_id.
 *   3. Inject the session into HRAuthContext and redirect to the Company
 *      Dashboard (/hr/dashboard).
 */
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Mail, User, Lock, Eye, EyeOff, ArrowLeft, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { registerCompany, verifyCompanyEmail, resendCompanyVerification } from "../../api/auth";
import logo from "../assets/logo.png";

const RESEND_COUNTDOWN = 60;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PLANS = [
  { id: "starter",      name: "Starter",      price: "$49/mo",  blurb: "Up to 15 users · 30 active jobs",   highlight: false },
  { id: "professional", name: "Professional", price: "$149/mo", blurb: "Up to 50 users · 100 active jobs",  highlight: true  },
  { id: "enterprise",   name: "Enterprise",   price: "$499/mo", blurb: "500 users · 999 active jobs",       highlight: false },
];

function strength(pw) {
  if (!pw) return { level: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { level: 1, label: "Weak", color: "#ef4444" };
  if (s <= 2) return { level: 2, label: "Medium", color: "#f97316" };
  return { level: 3, label: "Strong", color: "#22c55e" };
}

export default function CompanyRegister() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [plan, setPlan] = useState("professional");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Email verification step ────────────────────────────────────────────────
  const [step, setStep] = useState("form");        // "form" | "verify"
  const [challengeToken, setChallengeToken] = useState("");

  const pwStrength = useMemo(() => strength(password), [password]);

  const valid =
    companyName.trim().length >= 2 &&
    EMAIL_REGEX.test(companyEmail.trim()) &&
    adminName.trim().length >= 2 &&
    password.length >= 8;

  async function handleSubmit() {
    setError("");
    if (!valid) {
      setError("Please complete all fields. Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const data = await registerCompany({
        companyName: companyName.trim(),
        companyEmail: companyEmail.trim().toLowerCase(),
        adminName: adminName.trim(),
        password,
        plan,
      });
      // A 6-digit code was emailed; move to the verification step.
      setChallengeToken(data.challenge_token);
      setError(data.email_sent === false ? "Could not send the verification code. Please try again." : "");
      setStep("verify");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Called by the verification step once the email code is confirmed.
  function handleVerified(data) {
    setSession(data.user, data.access_token);
    navigate(data.redirect_to || "/hr/dashboard", { replace: true });
  }

  if (step === "verify") {
    return (
      <VerifyStep
        email={companyEmail.trim().toLowerCase()}
        challengeToken={challengeToken}
        setChallengeToken={setChallengeToken}
        initialError={error}
        onVerified={handleVerified}
        onBack={() => { setStep("form"); setError(""); }}
      />
    );
  }

  return (
    <div style={S.scene}>
      <div style={S.card}>
        <button type="button" onClick={() => navigate("/")} style={S.back}>
          <ArrowLeft size={16} /> Back Home
        </button>

        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <img src={logo} alt="TalentFlow" style={{ height: 44, marginBottom: 12 }} />
          <h1 style={S.title}>Start your free trial</h1>
          <p style={S.subtitle}>14 days free · no credit card required</p>
        </div>

        <Field label="Company Name" icon={Building2}>
          <input
            style={S.input}
            placeholder="Acme Inc."
            value={companyName}
            onChange={(e) => { setCompanyName(e.target.value); setError(""); }}
          />
        </Field>

        <Field label="Company Email" icon={Mail}>
          <input
            style={S.input}
            type="email"
            placeholder="admin@acme.com"
            value={companyEmail}
            onChange={(e) => { setCompanyEmail(e.target.value); setError(""); }}
          />
        </Field>

        <Field label="Admin Name" icon={User}>
          <input
            style={S.input}
            placeholder="Your full name"
            value={adminName}
            onChange={(e) => { setAdminName(e.target.value); setError(""); }}
          />
        </Field>

        <Field label="Password" icon={Lock}>
          <input
            style={S.input}
            type={showPw ? "text" : "password"}
            placeholder="Create a password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)} style={S.eye}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </Field>
        {password && (
          <div style={{ display: "flex", gap: 4, margin: "-6px 0 14px" }}>
            {[1, 2, 3].map((seg) => (
              <div key={seg} style={{
                height: 4, flex: 1, borderRadius: 99,
                background: pwStrength.level >= seg ? pwStrength.color : "#e2e8f0",
              }} />
            ))}
            <span style={{ fontSize: 11, fontWeight: 700, color: pwStrength.color, marginLeft: 6 }}>
              {pwStrength.label}
            </span>
          </div>
        )}

        {/* Subscription plan selector */}
        <label style={S.fieldLabel}>Subscription Plan</label>
        <div style={S.planGrid}>
          {PLANS.map((p) => {
            const selected = plan === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlan(p.id)}
                style={{
                  ...S.planCard,
                  borderColor: selected ? "#0A4174" : "#E2E8F0",
                  background: selected ? "#EFF6FF" : "#fff",
                  boxShadow: selected ? "0 4px 14px rgba(10,65,116,0.18)" : "none",
                }}
              >
                {p.highlight && <span style={S.popular}>Popular</span>}
                {selected && <span style={S.check}><Check size={13} strokeWidth={3} /></span>}
                <strong style={{ fontSize: 14, color: "#001D39" }}>{p.name}</strong>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#0A4174", margin: "2px 0" }}>{p.price}</span>
                <span style={{ fontSize: 11, color: "#64748B", lineHeight: 1.4 }}>{p.blurb}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div style={S.errorBox}>
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "#DC2626" }}>{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!valid || loading}
          style={{
            ...S.submit,
            background: valid ? "linear-gradient(135deg,#001D39,#0A4174)" : "#E2E8F0",
            color: valid ? "#fff" : "#94A3B8",
            cursor: valid && !loading ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "Creating your workspace…" : "Start Free Trial →"}
        </button>

        <p style={S.loginHint}>
          Already have an account?{" "}
          <span style={S.loginLink} onClick={() => navigate("/login")}>Sign in</span>
        </p>
      </div>
    </div>
  );
}

function VerifyStep({ email, challengeToken, setChallengeToken, initialError = "", onVerified, onBack }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState(initialError);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [resending, setResending] = useState(false);
  const refs = useRef([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const fullCode = digits.join("");

  const submitCode = useCallback(async (code) => {
    if (!challengeToken) { setErrorMsg("Session expired. Please register again."); return; }
    setStatus("loading");
    setErrorMsg("");
    try {
      const data = await verifyCompanyEmail(challengeToken, code);
      onVerified(data);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Invalid code. Please try again.");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => { setStatus("idle"); refs.current[0]?.focus(); }, 200);
    }
  }, [challengeToken, onVerified]);

  function handleChange(index, value) {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    setErrorMsg("");
    if (clean && index < 5) refs.current[index + 1]?.focus();
    if (clean && index === 5) {
      const code = next.join("");
      if (code.length === 6) submitCode(code);
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) refs.current[index + 1]?.focus();
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...pasted.split(""), ...Array(6 - pasted.length).fill("")];
    setDigits(next);
    if (pasted.length === 6) { refs.current[5]?.focus(); submitCode(pasted); }
    else refs.current[pasted.length]?.focus();
  }

  async function handleResend() {
    if (countdown > 0 || resending) return;
    setResending(true);
    setErrorMsg("");
    try {
      const res = await resendCompanyVerification(challengeToken);
      if (res.challenge_token) setChallengeToken(res.challenge_token);
      setCountdown(RESEND_COUNTDOWN);
      setDigits(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
      if (res.email_sent === false) setErrorMsg("Could not send the verification code. Please try again.");
    } catch {
      setErrorMsg("Could not send the verification code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.min(b.length, 4)) + c)
    : "your email";

  return (
    <div style={S.scene}>
      <div style={S.card}>
        <button type="button" onClick={onBack} style={S.back}>
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <img src={logo} alt="TalentFlow" style={{ height: 44, marginBottom: 12 }} />
          <div style={S.verifyIcon}>
            <Mail size={28} color="#0A4174" />
          </div>
          <h1 style={S.title}>Verify your email</h1>
          <p style={S.subtitle}>
            We sent a 6-digit code to<br />
            <strong style={{ color: "#0A4174" }}>{maskedEmail}</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 22 }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              disabled={status === "loading"}
              style={{
                width: 48, height: 58, textAlign: "center",
                fontSize: 24, fontWeight: 800,
                color: status === "error" ? "#DC2626" : "#0A4174",
                border: `2px solid ${status === "error" ? "#FCA5A5" : d ? "#0A4174" : "#E2E8F0"}`,
                borderRadius: 12, background: d ? "#EFF6FF" : "#F8FAFC",
                outline: "none", transition: "all 0.15s",
              }}
            />
          ))}
        </div>

        {errorMsg && (
          <div style={S.errorBox}>
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "#DC2626" }}>{errorMsg}</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => submitCode(fullCode)}
          disabled={fullCode.length < 6 || status === "loading"}
          style={{
            ...S.submit,
            background: fullCode.length === 6 ? "linear-gradient(135deg,#001D39,#0A4174)" : "#E2E8F0",
            color: fullCode.length === 6 ? "#fff" : "#94A3B8",
            cursor: fullCode.length === 6 && status !== "loading" ? "pointer" : "not-allowed",
          }}
        >
          {status === "loading" ? "Verifying…" : "Verify Email →"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <p style={{ fontSize: 13, color: "#64748B", marginBottom: 4 }}>Didn't receive the code?</p>
          {countdown > 0 ? (
            <p style={{ fontSize: 13, color: "#94A3B8" }}>
              Resend in <strong style={{ color: "#0A4174" }}>{countdown}s</strong>
            </p>
          ) : (
            <button type="button" onClick={handleResend} disabled={resending} style={S.resendBtn}>
              {resending ? "Sending…" : "Resend Code"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={S.fieldLabel}>{label}</label>
      <div style={S.fieldBox}>
        <Icon size={18} color="#49769F" />
        {children}
      </div>
    </div>
  );
}

const S = {
  scene: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    padding: "32px 16px",
    background: "linear-gradient(135deg,#001D39 0%,#0A4174 52%,#4E8EA2 100%)",
  },
  card: {
    position: "relative", width: "100%", maxWidth: 480,
    background: "#fff", borderRadius: 24, padding: "40px 36px",
    boxShadow: "0 40px 100px rgba(0,29,57,0.35)",
  },
  back: {
    position: "absolute", top: 18, left: 18, display: "flex", alignItems: "center", gap: 5,
    background: "none", border: "none", cursor: "pointer", color: "#49769F",
    fontSize: 13, fontWeight: 600, padding: 4,
  },
  title: { fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 6px", letterSpacing: "-0.02em" },
  subtitle: { fontSize: 13.5, color: "#64748B", margin: 0 },
  fieldLabel: { display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 },
  fieldBox: {
    display: "flex", alignItems: "center", gap: 10,
    border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "0 12px",
    background: "#F8FAFC", height: 48,
  },
  input: {
    flex: 1, border: "none", outline: "none", background: "transparent",
    fontSize: 14, color: "#0F172A", height: "100%",
  },
  eye: { background: "none", border: "none", cursor: "pointer", padding: 0, color: "#49769F", lineHeight: 0 },
  planGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 },
  planCard: {
    position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start",
    gap: 1, padding: "14px 12px", borderRadius: 14, border: "1.5px solid #E2E8F0",
    cursor: "pointer", textAlign: "left", transition: "all 0.18s",
  },
  popular: {
    position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)",
    background: "#0A4174", color: "#fff", fontSize: 9, fontWeight: 800,
    padding: "2px 8px", borderRadius: 99, letterSpacing: "0.04em", whiteSpace: "nowrap",
  },
  check: {
    position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: "50%",
    background: "#0A4174", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
  },
  errorBox: { padding: "10px 14px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: 14 },
  submit: {
    width: "100%", height: 52, border: "none", borderRadius: 14,
    fontSize: 15, fontWeight: 800, transition: "all 0.2s",
    boxShadow: "0 12px 32px rgba(0,29,57,0.22)",
  },
  loginHint: { textAlign: "center", fontSize: 13, color: "#64748B", margin: "16px 0 0" },
  loginLink: { color: "#2563EB", fontWeight: 700, cursor: "pointer" },
  verifyIcon: {
    width: 64, height: 64, borderRadius: "50%", margin: "4px auto 16px",
    background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", border: "2px solid #BDD8E9",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  resendBtn: {
    background: "none", border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 700,
    color: "#0A4174", textDecoration: "underline", textUnderlineOffset: 3,
  },
};
