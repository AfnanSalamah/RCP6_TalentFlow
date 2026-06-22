import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { applicantLogin, applicantRegister, applicantLogout, applicantMe } from '../../api/auth';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem("tf_user_data");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const storedUser = readStoredUser();
  const hasToken   = !!localStorage.getItem("tf_user_token");

  const [user,            setUser]            = useState(storedUser);
  const [isAuthenticated, setIsAuthenticated] = useState(!!storedUser && hasToken);

  /**
   * loading semantics
   * ─────────────────
   * true  → we have a token but still need to verify / hydrate the user object.
   *         Route guards MUST render a spinner and not the protected page.
   * false → auth state is fully resolved (either authenticated or not).
   *
   * We start as `true` ONLY when there is a token but the user profile is not
   * yet cached in localStorage (first-load or corrupted storage).  When both
   * token + cached user are present we can trust localStorage immediately and
   * start as `false` so the dashboard appears without a spinner on every visit.
   */
  const [loading, setLoading] = useState(hasToken && !storedUser);

  // ── Token verification on mount ───────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("tf_user_token");

    if (!token) {
      // No session at all — nothing to verify, stay unauthenticated.
      setLoading(false);
      return;
    }

    if (storedUser) {
      // User profile already hydrated from localStorage — show the page
      // immediately and verify silently in the background so stale data
      // gets refreshed without blocking the UI.
      setLoading(false);
      applicantMe()
        .then((fresh) => {
          setUser(fresh);
          localStorage.setItem("tf_user_data", JSON.stringify(fresh));
        })
        .catch(() => {
          // Token is invalid / expired — clear everything and sign out.
          localStorage.removeItem("tf_user_token");
          localStorage.removeItem("tf_user_data");
          setUser(null);
          setIsAuthenticated(false);
        });
      return;
    }

    // Token exists but no cached profile — we MUST fetch before rendering.
    // `loading` is already `true` (set in useState above).
    applicantMe()
      .then((data) => {
        setUser(data);
        setIsAuthenticated(true);
        localStorage.setItem("tf_user_data", JSON.stringify(data));
      })
      .catch(() => {
        localStorage.removeItem("tf_user_token");
        localStorage.removeItem("tf_user_data");
        setIsAuthenticated(false);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for token expiry
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.type === "applicant") {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("tf_user_data");
      }
    };
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, []);

  /**
   * login / register
   * These are called by the legacy UserAuthContext login flow (kept for
   * backwards-compat).  LoginPage.jsx now uses unifiedLogin() directly and
   * writes to localStorage before navigating, so these code-paths are rarely
   * hit — but they must remain correct in case other components call them.
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const userData = await applicantLogin(email, password);
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem("tf_user_data", JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    try {
      const userData = await applicantRegister(name, email, password);
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem("tf_user_data", JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    applicantLogout();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("tf_user_data");
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("tf_user_data", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateSettings = useCallback((changes) => {
    setUser((prev) => {
      const next = { ...prev, settings: { ...(prev?.settings || {}), ...changes } };
      localStorage.setItem("tf_user_data", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, loading,
      login, register, logout, updateUser, updateSettings,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
