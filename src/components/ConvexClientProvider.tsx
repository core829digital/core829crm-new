"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ReactNode, useCallback, useMemo } from "react";
import { AuthProvider, useAuth } from "./AuthContext";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = url ? new ConvexReactClient(url) : null;

/** Collega il token di sessione (firmato dal server al login) a Convex: ogni richiesta al database lo porta con se'. */
function useServerToken() {
  const { user } = useAuth();
  const token = user?.token ?? null;
  const fetchAccessToken = useCallback(async () => token, [token]);
  return useMemo(() => ({ isLoading: false, isAuthenticated: token !== null, fetchAccessToken }), [token, fetchAccessToken]);
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {convex ? (
        <ConvexProviderWithAuth client={convex} useAuth={useServerToken}>
          {children}
        </ConvexProviderWithAuth>
      ) : (
        children
      )}
    </AuthProvider>
  );
}
