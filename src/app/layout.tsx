import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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

// Stack tipografico: "Saans" se installato, altrimenti Inter self-hosted da next/font, più JetBrains Mono.
// Michroma/DM Sans (brand) valutati e scartati: non coprono cirillico e greco.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#f8f8f8]">
        <ConvexWrapper>
          <AppShell>{children}</AppShell>
        </ConvexWrapper>
      </body>
    </html>
  );
}
