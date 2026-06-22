import { createContext, useContext, useState, useEffect } from 'react';
import { saApi } from '../api/index';

const Ctx = createContext(null);

export function SAAuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tf_sa_token') || localStorage.getItem('tf_hr_token');
    if (!token) { setLoading(false); return; }
    saApi.me()
      .then(u => setUser(u))
      .catch(() => localStorage.removeItem('tf_sa_token'))
      .finally(() => setLoading(false));
  }, []);

  function login(token, userData) {
    localStorage.setItem('tf_sa_token', token);
    setUser(userData);
  }

  /**
   * logout — production-ready Super Admin sign-out.
   *
   * 1. Clears every auth artefact from both storages. The SA session is held in
   *    the HR context (tf_hr_token + tf_hr_user with hrRole "super_admin"), and
   *    there is also a legacy tf_sa_token, so ALL keys must go — otherwise
   *    RootPage ("/") re-detects a super_admin and bounces back to the dashboard.
   * 2. Resets in-memory React state.
   * 3. Hard-replaces the URL with the Welcome/Landing page ("/"). Using
   *    location.replace (not href / navigate) drops the admin route from history,
   *    so the browser Back button cannot return to a protected page. A full
   *    reload also guarantees BOTH auth providers re-initialise from now-empty
   *    storage, so every route guard sees an unauthenticated user.
   */
  function logout() {
    // 1 — wipe tokens, cached users, and any other app state
    localStorage.clear();
    sessionStorage.clear();
    // 2 — reset context state (in case anything renders before the reload)
    setUser(null);
    // 3 — redirect to the Welcome page, replacing history (Back-button safe)
    window.location.replace('/');
  }

  return (
    <Ctx.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSAAuth = () => useContext(Ctx);
