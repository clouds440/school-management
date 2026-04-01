import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  description: "Manage your school efficiently",
};

import Navbar from "@/components/Navbar";
import { Providers } from "@/components/Providers";
import DashboardMainWrapper from "@/components/DashboardMainWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="min-h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen flex flex-col bg-theme-bg transition-colors duration-500 overflow-hidden`}
      >
        <Providers>
          <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
            {/* Branded Atmospheric Gradient */}
            <div className="absolute inset-0 bg-theme-bg/50" />
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-secondary/10" />

            {/* Animated Branded Blobs */}
            <div className="absolute -top-12 -left-12 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-12 left-1/2 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
          </div>

          <Navbar />
          <DashboardMainWrapper>
            {children}
          </DashboardMainWrapper>
        </Providers>
      </body>
    </html>
  );
}
