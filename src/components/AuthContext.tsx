"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

const SESSION_DURATION = 3 * 60 * 60 * 1000; // 3 hours

export type AuthUser = {
  _id: string;
  userId: string;
  name: string;
  surname: string;
  role: string;
};

type AuthSession = {
  user: AuthUser;
  loggedInAt: number;
};

type AuthContextType = {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});

function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("crm_user");
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (!session.user || !session.loggedInAt) {
      localStorage.removeItem("crm_user");
      return null;
    }
    if (Date.now() - session.loggedInAt > SESSION_DURATION) {
      localStorage.removeItem("crm_user");
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem("crm_user");
    return null;
  }
}

function saveSession(user: AuthUser) {
  const session: AuthSession = { user, loggedInAt: Date.now() };
  localStorage.setItem("crm_user", JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem("crm_user");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const session = getSession();
    return session ? session.user : null;
  });

  const handleSetUser = (u: AuthUser | null) => {
    setUser(u);
    if (u) {
      saveSession(u);
    } else {
      clearSession();
    }
  };

  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      const session = getSession();
      if (!session) {
        setUser(null);
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
