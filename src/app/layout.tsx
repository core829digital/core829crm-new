import type { Metadata, Viewport } from "next";
import "./globals.css";
import ConvexWrapper from "@/components/ConvexWrapper";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Core829 CRM",
  description: "Sales Tracker CRM for setters and closers",
  icons: {
    apple: "/logo-icon.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Core829 CRM" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fafafa]">
        <ConvexWrapper>
          <AppShell>{children}</AppShell>
        </ConvexWrapper>
      </body>
    </html>
  );
}
