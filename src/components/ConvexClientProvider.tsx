"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ReactNode, useCallback, useMemo } from "react";
import { AuthProvider, useAuth } from "./AuthContext";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = url ? new ConvexReactClient(url) : null;

/** Collega il token breve (rilasciato dal server se il cookie HttpOnly e' valido) a Convex: ogni richiesta al database lo porta con se'. */
function useServerToken() {
  const { user, loading, getToken } = useAuth();
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => getToken(forceRefreshToken),
    [getToken],
  );
  const authenticated = user !== null;
  return useMemo(() => ({ isLoading: loading, isAuthenticated: authenticated, fetchAccessToken }), [loading, authenticated, fetchAccessToken]);
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
