"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/**
 * Sessione: il segreto di lunga durata sta in un cookie HttpOnly che il JavaScript non puo' leggere.
 * Qui si tiene solo un token BREVE (10 minuti), in memoria (mai in localStorage), che il server rilascia
 * ogni volta che il cookie e' valido. Chiudere la scheda lo cancella.
 */

export type AuthUser = {
  _id: string;
  userId: string;
  name: string;
  surname: string;
  role: string;
};

type TokenResponse = { token: string; expiresAt: number; user: AuthUser };

type AuthContextType = {
  user: AuthUser | null;
  /** true finche' non si sa se esiste una sessione valida (evita il lampo verso /login). */
  loading: boolean;
  signIn: (userId: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
  /** Token breve per Convex (rinnovato da solo poco prima della scadenza). */
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ ok: false, error: "Not ready" }),
  signOut: async () => {},
  getToken: async () => null,
});

const REFRESH_MARGIN_MS = 60_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const cache = useRef<{ token: string; expiresAt: number } | null>(null);
  const inflight = useRef<Promise<string | null> | null>(null);

  const fetchToken = useCallback((): Promise<string | null> => {
    if (inflight.current) return inflight.current;
    const p = (async () => {
      try {
        const res = await fetch("/api/auth/token", { credentials: "same-origin", cache: "no-store" });
        if (!res.ok) {
          cache.current = null;
          if (res.status === 401) setUser(null);
          return null;
        }
        const data = (await res.json()) as TokenResponse;
        cache.current = { token: data.token, expiresAt: data.expiresAt };
        setUser((prev) => (prev && prev._id === data.user._id ? prev : data.user));
        return data.token;
      } catch {
        return cache.current?.token ?? null;
      } finally {
        inflight.current = null;
      }
    })();
    inflight.current = p;
    return p;
  }, []);

  const getToken = useCallback(
    async (forceRefresh = false) => {
      const c = cache.current;
      if (!forceRefresh && c && c.expiresAt - Date.now() > REFRESH_MARGIN_MS) return c.token;
      return fetchToken();
    },
    [fetchToken],
  );

  // All'avvio: c'e' una sessione valida (cookie)? Se si', il server ci da' utente e token breve.
  useEffect(() => {
    let alive = true;
    void fetchToken().finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [fetchToken]);

  const signIn = useCallback<AuthContextType["signIn"]>(
    async (userId, password) => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, password }),
        });
        if (res.status === 429) return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
        if (!res.ok) return { ok: false, error: "Invalid ID or password" };
        const token = await fetchToken();
        return token ? { ok: true } : { ok: false, error: "Could not start the session" };
      } catch {
        return { ok: false, error: "Network error" };
      }
    },
    [fetchToken],
  );

  const signOut = useCallback(async () => {
    cache.current = null;
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      setUser(null);
    }
  }, []);

  // Se la sessione scade o viene chiusa da un'altra parte, il prossimo rinnovo lo scopre: ricontrolla ogni minuto.
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => void getToken(), 60_000);
    return () => clearInterval(id);
  }, [user, getToken]);

  const value = useMemo(() => ({ user, loading, signIn, signOut, getToken }), [user, loading, signIn, signOut, getToken]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
