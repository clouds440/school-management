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
  title: "EduManage",
  description: "Manage your school efficiently",
};

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-linear-to-br from-indigo-50 via-white to-purple-50 overflow-x-hidden`}
      >
        <Providers>
          <div className="fixed inset-0 z-[-1] pointer-events-none">
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
            <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
          </div>

          <Navbar />
          <main className="flex-grow flex flex-col relative z-10 w-full">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
