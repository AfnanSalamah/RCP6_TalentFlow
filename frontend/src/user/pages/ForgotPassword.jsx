import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, Lock } from "lucide-react";
import { forgotPasswordAny, resetPasswordOtp } from "../../api/auth";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [portal, setPortal] = useState("applicant");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function sendCode(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError("");
    try {
      let activePortal = portal;
      let res = await forgotPasswordAny(email.trim(), activePortal);
      if (!res?.email_sent && window.location.hostname === "127.0.0.1") {
        const alternatePortal = activePortal === "hr" ? "applicant" : "hr";
        const alternate = await forgotPasswordAny(email.trim(), alternatePortal);
        if (alternate?.email_sent) {
          activePortal = alternatePortal;
          res = alternate;
          setPortal(alternatePortal);
        }
      }
      if (res?.email_sent === false) setError("Could not send the verification code. Please try again.");
      setStep("code");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally { setLoading(false); }
  }

  async function reset(e) {
    e.preventDefault();
    if (password.length < 8 || password !== confirm || code.trim().length !== 6) return;
    setLoading(true); setError("");
    try {
      await resetPasswordOtp(email.trim(), code.trim(), password, portal);
      setDone(true);
    } catch (err) {
      setError(err.message || "Invalid or expired code.");
    } finally { setLoading(false); }
  }

  return (
    <div style={styles.scene}>
      <div style={styles.card}>
        <button type="button" style={styles.back} onClick={() => navigate("/login")}><ArrowLeft size={16} /> Back to Login</button>
        {done ? (
          <div style={{ textAlign: "center" }}>
            <CheckCircle size={52} color="#22c55e" style={{ marginBottom: 16 }} />
            <h2 style={styles.title}>Password Reset!</h2>
            <p style={styles.desc}>Your password has been updated. You can now log in with your new password.</p>
            <button style={styles.btn} onClick={() => navigate("/login")}>Go to Login</button>
          </div>
        ) : step === "email" ? (
          <>
            <h2 style={styles.title}>Forgot Password?</h2>
            <p style={styles.desc}>Choose your account type and enter your email. We’ll send a 6-digit OTP code.</p>
            <form onSubmit={sendCode}>
              <label style={styles.label}>Account Type</label>
              <select style={styles.select} value={portal} onChange={(e) => setPortal(e.target.value)}>
                <option value="applicant">Applicant</option>
                <option value="hr">HR Admin / Super Admin</option>
              </select>
              <label style={styles.label}>Email Address</label>
              <div style={styles.fieldBox}><Mail size={18} color="#64748b" /><input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} autoFocus /></div>
              {error && <p style={styles.error}>{error}</p>}
              <button type="submit" style={styles.btn} disabled={loading || !email.trim()}>{loading ? "Sending…" : "Send 6-digit Code"}</button>
            </form>
          </>
        ) : (
          <>
            <h2 style={styles.title}>Enter Code</h2>
            <p style={styles.desc}>Enter the 6-digit OTP sent to <strong>{email}</strong>, then create a new password.</p>
            <form onSubmit={reset}>
              <label style={styles.label}>OTP Code</label>
              <div style={styles.fieldBox}><Mail size={18} color="#64748b" /><input inputMode="numeric" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} style={styles.input} /></div>
              <label style={styles.label}>New Password</label>
              <div style={styles.fieldBox}><Lock size={18} color="#64748b" /><input type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} /></div>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.fieldBox}><Lock size={18} color="#64748b" /><input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={styles.input} /></div>
              {password && confirm && password !== confirm && <p style={styles.error}>Passwords do not match.</p>}
              {error && <p style={styles.error}>{error}</p>}
              <button type="submit" style={styles.btn} disabled={loading || code.length !== 6 || password.length < 8 || password !== confirm}>{loading ? "Saving…" : "Reset Password"}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  scene: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #001d39 0%, #0a4174 100%)", padding: 20 },
  card: { background: "#fff", borderRadius: 20, padding: "40px 36px", maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
  back: { display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 13, fontWeight: 600, marginBottom: 24, padding: 0 },
  title: { margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "#0f172a" },
  desc: { margin: "0 0 24px", fontSize: 14, color: "#64748b", lineHeight: 1.6 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
  fieldBox: { display: "flex", alignItems: "center", gap: 10, border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "12px 16px", marginBottom: 16 },
  input: { flex: 1, border: "none", outline: "none", fontSize: 14, color: "#1e293b", background: "transparent" },
  select: { width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 14 },
  error: { color: "#dc2626", fontSize: 12, fontWeight: 600, marginBottom: 12 },
  btn: { width: "100%", height: 48, border: "none", borderRadius: 14, background: "linear-gradient(135deg,#001d39,#0a4174)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8 },
};
