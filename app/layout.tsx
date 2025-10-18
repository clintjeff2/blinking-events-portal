import type React from "react";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { ReduxProvider } from "@/lib/redux/provider";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blinking Events Admin Portal",
  description: "Manage your event services, staff, orders, and more",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased`}
      >
        <ReduxProvider>
          <AuthProvider>
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
            <Toaster />
            <Analytics />
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
