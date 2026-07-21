"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import Navigation from "./Navigation";
import AnnouncementBanner from "./AnnouncementBanner";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!user && !isLoginPage) {
      router.replace("/login");
    }
  }, [user, isLoginPage, router]);

  if (!user && !isLoginPage) return null;

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navigation />
      <AnnouncementBanner />
      <main className="mx-auto px-4 py-6">{children}</main>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  );
}
