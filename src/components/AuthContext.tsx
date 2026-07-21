"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type AuthUser = {
  _id: string;
  userId: string;
  name: string;
  surname: string;
  role: string;
};

type AuthContextType = {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("crm_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      if (typeof window !== "undefined") localStorage.removeItem("crm_user");
      return null;
    }
  });

  const handleSetUser = (u: AuthUser | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem("crm_user", JSON.stringify(u));
    } else {
      localStorage.removeItem("crm_user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
