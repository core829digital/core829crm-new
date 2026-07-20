import type { Metadata } from "next";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Core829 CRM",
  description: "Sales Tracker CRM for setters and closers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fafafa]">
        <ConvexClientProvider>
          <Navigation />
          <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
