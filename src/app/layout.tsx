import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import NavbarWrapper from "@/components/NavbarWrapper";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Čtenářský Deník",
  description: "Vytvářejte své čtenářské zápisky jednoduše",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
        />
        <style>
          {`
            html, body {
              max-width: 100vw;
              width: 100%;
              overflow-x: hidden;
              position: relative;
            }
            canvas {
              max-width: 100vw !important;
              width: 100% !important;
              left: 0 !important;
              right: 0 !important;
              overflow: hidden !important;
            }
          `}
        </style>
      </head>
      <body
        className={`${inter.variable} font-sans antialiased overflow-x-hidden`}
        style={{ maxWidth: "100vw" }}
      >
        <Providers>
          <div className="flex flex-col min-h-screen relative z-10 w-full max-w-[100vw] box-border overflow-x-hidden">
            <NavbarWrapper />
            <main className="flex-1 flex flex-col w-full overflow-x-hidden">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
