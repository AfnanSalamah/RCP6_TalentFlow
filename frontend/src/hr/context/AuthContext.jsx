import { createContext, useContext, useState, useEffect } from "react";
import { hrLogin, hrMe, hrLogout } from "../../api/auth";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = sessionStorage.getItem("tf_hr_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);

  // Verify HR token on mount
  useEffect(() => {
    const token = localStorage.getItem("tf_hr_token");
    if (token && !user) {
      hrMe()
        .then((data) => {
          setUser(data);
          sessionStorage.setItem("tf_hr_user", JSON.stringify(data));
        })
        .catch(() => {
          localStorage.removeItem("tf_hr_token");
          sessionStorage.removeItem("tf_hr_user");
        });
    }
  }, []);

  // Listen for token expiry
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.type === "hr") {
        setUser(null);
        sessionStorage.removeItem("tf_hr_user");
      }
    };
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, []);

  async function login(identifier, password) {
    setLoading(true);
    try {
      const userData = await hrLogin(identifier, password);
      setUser(userData);
      sessionStorage.setItem("tf_hr_user", JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }

  /**
   * setSession — inject an already-verified HR session directly.
   *
   * Called by LoginPage after the unified /auth/login endpoint returns
   * portal === "hr".  Avoids a second round-trip to /auth/hr/me.
   *
   * @param {object} userData  – user object from the unified response
   * @param {string} token     – JWT access token from the unified response
   */
  function setSession(userData, token) {
    localStorage.setItem("tf_hr_token", token);
    sessionStorage.setItem("tf_hr_user", JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    hrLogout();
    setUser(null);
    sessionStorage.removeItem("tf_hr_user");
  }

  return (
    <AuthContext.Provider value={{ user, login, setSession, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
