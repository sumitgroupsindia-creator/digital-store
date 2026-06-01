import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

const STORAGE_TOKEN = 'sumit_digital_token';
const STORAGE_USER = 'sumit_digital_user';

/** Reads the one-time SSO token handed off from the main site via URL fragment. */
function readSsoToken() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : '';
  if (!hash) return null;
  try {
    const token = new URLSearchParams(hash).get('sso');
    return token ? decodeURIComponent(token) : null;
  } catch {
    return null;
  }
}

/** Removes the SSO fragment from the URL without reloading. */
function stripSsoFromUrl() {
  if (typeof window === 'undefined') return;
  const url = window.location.pathname + window.location.search;
  window.history.replaceState(null, '', url || '/');
}

export function AuthProvider({ children, queryClient }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_USER));
    } catch {
      return null;
    }
  });

  // If a handoff token is present in the URL, we must validate it before
  // rendering protected routes — otherwise ProtectedRoute would bounce to /login.
  const [ssoLoading, setSsoLoading] = useState(() => !!readSsoToken());

  const login = useCallback((token, userData) => {
    localStorage.setItem(STORAGE_TOKEN, token);
    localStorage.setItem(STORAGE_USER, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
    if (queryClient) queryClient.clear();
    setUser(null);
  }, [queryClient]);

  // One-time SSO handoff from sumitgroups.com → digital.sumitgroups.com
  useEffect(() => {
    const ssoToken = readSsoToken();
    if (!ssoToken) return;

    let cancelled = false;
    // Persist token first so the api interceptor attaches it to /auth/me.
    localStorage.setItem(STORAGE_TOKEN, ssoToken);

    api
      .get('/auth/me')
      .then((res) => {
        if (cancelled) return;
        const me = res.data;
        localStorage.setItem(STORAGE_USER, JSON.stringify(me));
        setUser(me);
      })
      .catch(() => {
        // Invalid/expired handoff token — clear it, user can log in manually.
        localStorage.removeItem(STORAGE_TOKEN);
        localStorage.removeItem(STORAGE_USER);
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        stripSsoFromUrl();
        if (!cancelled) setSsoLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user, ssoLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
