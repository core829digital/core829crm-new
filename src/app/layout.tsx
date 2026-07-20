import type { Metadata } from "next";
import "./globals.css";
import ConvexWrapper from "@/components/ConvexWrapper";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Core829 CRM",
  description: "Sales Tracker CRM for setters and closers",
  icons: { icon: "/logo-icon.png" },
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
          <Navigation />
          <main className="mx-auto px-4 py-6">{children}</main>
        </ConvexWrapper>
      </body>
    </html>
  );
}
