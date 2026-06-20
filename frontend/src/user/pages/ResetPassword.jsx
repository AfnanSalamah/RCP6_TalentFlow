import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { resetPassword } from "../../api/auth";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [done,        setDone]        = useState(false);

  const passwordsMatch = password !== "" && password === confirm;
  const mismatch       = confirm !== "" && password !== confirm;
  const valid          = password.length >= 8 && passwordsMatch && !!token;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div style={styles.scene}>
        <div style={styles.card}>
          <h2 style={styles.title}>Invalid Link</h2>
          <p style={styles.desc}>This reset link is missing or invalid. Please request a new one.</p>
          <button style={styles.btn} onClick={() => navigate("/forgot-password")}>
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.scene}>
      <div style={styles.card}>
        {done ? (
          <div style={{ textAlign: "center" }}>
            <CheckCircle size={52} color="#22c55e" style={{ marginBottom: 16 }} />
            <h2 style={styles.title}>Password Reset!</h2>
            <p style={styles.desc}>Your password has been updated. You can now log in with your new password.</p>
            <button style={styles.btn} onClick={() => navigate("/login")}>
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <h2 style={styles.title}>Set New Password</h2>
            <p style={styles.desc}>Enter and confirm your new password below.</p>

            <form onSubmit={handleSubmit}>
              <label style={styles.label}>New Password</label>
              <div style={styles.fieldBox}>
                <Lock size={18} color="#64748b" />
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  autoFocus
                />
                <button type="button" style={styles.eyeBtn} onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <label style={styles.label}>Confirm Password</label>
              <div style={{ ...styles.fieldBox, borderColor: mismatch ? "#ef4444" : passwordsMatch ? "#22c55e" : "#e2e8f0" }}>
                <Lock size={18} color="#64748b" />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  style={styles.input}
                />
                <button type="button" style={styles.eyeBtn} onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mismatch && <p style={styles.mismatch}>Passwords do not match</p>}
              {passwordsMatch && <p style={styles.match}>✓ Passwords match</p>}

              {error && <p style={styles.error}>{error}</p>}

              <button type="submit" style={{ ...styles.btn, opacity: valid ? 1 : 0.6 }} disabled={!valid || loading}>
                {loading ? "Saving…" : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  scene: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #001d39 0%, #0a4174 100%)",
    padding: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: "40px 36px",
    maxWidth: 420,
    width: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  title: {
    margin: "0 0 8px",
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
  },
  desc: {
    margin: "0 0 24px",
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.6,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  },
  fieldBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    border: "1.5px solid #e2e8f0",
    borderRadius: 12,
    padding: "12px 16px",
    marginBottom: 6,
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 14,
    color: "#1e293b",
    background: "transparent",
  },
  eyeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    padding: 0,
    lineHeight: 0,
  },
  error:    { color: "#dc2626", fontSize: 12, fontWeight: 600, margin: "8px 0" },
  mismatch: { color: "#ef4444", fontSize: 11, fontWeight: 700, margin: "4px 0 12px" },
  match:    { color: "#22c55e", fontSize: 11, fontWeight: 700, margin: "4px 0 12px" },
  btn: {
    width: "100%",
    height: 48,
    border: "none",
    borderRadius: 14,
    background: "linear-gradient(135deg,#001d39,#0a4174)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
  },
};
