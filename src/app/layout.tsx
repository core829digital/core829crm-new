import type { Metadata, Viewport } from "next";
import { DM_Sans, Michroma } from "next/font/google";
import "./globals.css";
import ConvexWrapper from "@/components/ConvexWrapper";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Core829 CRM",
  description: "Sales Tracker CRM for setters and closers",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Core829 CRM" },
  openGraph: {
    title: "Core829 CRM",
    description: "Sales Tracker CRM for setters and closers",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  themeColor: "#141416",
};

// Tipografia del brand CORE829 (Guidelines 1.0): Michroma per H1 ed etichette, DM Sans per testi e interfacce.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const michroma = Michroma({
  variable: "--font-michroma",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  display: "swap",
});

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${michroma.variable}`}>
      <body className="min-h-screen bg-[#f8f8f8]">
        <ConvexWrapper>
          <AppShell>{children}</AppShell>
        </ConvexWrapper>
      </body>
    </html>
  );
}
