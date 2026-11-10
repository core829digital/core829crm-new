"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./AuthContext";
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
      <main className="mx-auto px-3 sm:px-4 py-4 sm:py-6 min-h-[calc(100vh-10rem)]">{children}</main>
      
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>{children}</AuthGuard>
  );
}
