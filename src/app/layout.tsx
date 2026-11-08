import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ConvexWrapper from "@/components/ConvexWrapper";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Core829 CRM",
  description: "Sales Tracker CRM for setters and closers",
  icons: {
    icon: "/CORE829%20LARGE%20PX%20logo%20no%20letters.png",
    apple: "/CORE829%20LARGE%20PX%20logo%20no%20letters.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Core829 CRM" },
  openGraph: {
    title: "Core829 CRM",
    description: "Sales Tracker CRM for setters and closers",
    images: [{ url: "/CORE829%20LARGE%20PX%20logo%20no%20letters.png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  themeColor: "#111217",
};

// Stesso stack di Andromedia Web e di core829.net: "Saans" se installato sul dispositivo, altrimenti Inter
// self-hosted da next/font (font variabile: normale, bold e ogni peso intermedio), piu' JetBrains Mono.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#f6f8fa]">
        <ConvexWrapper>
          <AppShell>{children}</AppShell>
        </ConvexWrapper>
      </body>
    </html>
  );
}
