import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import ThreeBackground from "@/components/ThreeBackground";
import NavbarWrapper from "@/components/NavbarWrapper";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Čtenářský Deník",
  description: "Vytvářejte své čtenářské zápisky jednoduše",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans min-h-screen flex flex-col bg-background antialiased overflow-x-hidden`}
      >
        {/* Three.js animated background */}
        <ThreeBackground className="bg-background" />

        {/* Subtle gradient overlay for better text readability */}
        <div className="fixed inset-0 bg-gradient-to-b from-background/80 via-background/20 to-background/80 pointer-events-none z-[-1]"></div>

        <Providers>
          <div className="flex flex-col min-h-screen relative z-10">
            <NavbarWrapper />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
