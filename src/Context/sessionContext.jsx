// src/Context/sessionContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Read session once on mount — localStorage is synchronous so this is instant
  useEffect(() => {
    const raw = localStorage.getItem('solskies_session');
    if (!raw) { setLoading(false); return; }
    try {
      const s = JSON.parse(raw);
      if (Date.now() < s.expiresAt) {
        setUser(s.user);
      } else {
        localStorage.removeItem('solskies_session');
        localStorage.removeItem('solskies_user');
      }
    } catch {
      localStorage.removeItem('solskies_session');
      localStorage.removeItem('solskies_user');
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData, rememberMe = false) => {
    const expiresAt = Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000;
    const session = { user: userData, role: userData.role, loggedInAt: Date.now(), expiresAt };
    localStorage.setItem('solskies_session', JSON.stringify(session));
    localStorage.setItem('solskies_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // logout: hard-redirect to /?loggedOut=1 — this is the ONLY correct approach.
  //
  // WHY window.location.replace() and NOT navigate():
  //   React Router navigate() is async. After logout(), isAuthenticated becomes
  //   false immediately. Every component with an auth-guard useEffect fires
  //   navigate('/') simultaneously, racing each other → freeze.
  //   window.location.replace() fully unloads React so no effect can compete.
  //
  // WHY /?loggedOut=1 and NOT /:
  //   Phantom/Solflare stay connected in the browser extension after logout.
  //   Without the flag, Home.jsx sees connected=true + publicKey → auto-checks
  //   wallet → finds user → logs back in → infinite loop.
  //   The flag tells Home to skip the wallet check for this exact page load.
  //
  // WHY window.solana.disconnect() is attempted:
  //   Some wallet adapters don't expose disconnect via useWallet at the context
  //   level. window.solana is the universal fallback.
  // ─────────────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    // 1. Clear all session storage first
    localStorage.removeItem('solskies_session');
    localStorage.removeItem('solskies_user');
    localStorage.removeItem('justLoggedOut'); // clean up old flag if present

    // 2. Attempt wallet disconnect (best-effort — failure is non-fatal)
    try {
      if (window.solana?.disconnect) {
        await window.solana.disconnect();
      }
    } catch (_) {
      // non-fatal — wallet may already be disconnected
    }

    // 3. Clear React state (will trigger re-renders but hard-redirect follows immediately)
    setUser(null);

    // 4. Hard-redirect with loggedOut flag — fully unmounts React tree,
    //    eliminating all race conditions between competing navigations.
    window.location.replace('/?loggedOut=1');
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // clearSession: clears localStorage and resets user WITHOUT redirecting
  //
  // Used when switching wallets — the user is still on the page, but we need
  // to clear the stale session data without the hard redirect that logout uses.
  // ─────────────────────────────────────────────────────────────────────────
  const clearSession = useCallback(() => {
    localStorage.removeItem('solskies_session');
    localStorage.removeItem('solskies_user');
    setUser(null);
  }, []);

  // isAuthenticated is DERIVED from user — never a separate boolean state
  // that can drift out of sync with the user object.
  const isAuthenticated = !!user;

  return (
    <SessionContext.Provider value={{ user, loading, isAuthenticated, login, logout, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
};
