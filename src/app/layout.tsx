import React from "react";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import NavbarWrapper from "@/components/NavbarWrapper";
import Footer from "@/components/Footer";
import { metadata } from "./metadata";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export { metadata };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="cs"
      className="h-full min-h-screen scroll-smooth"
      suppressHydrationWarning
    >
      <head>
        <title>Čtenářský Deník</title>
        <meta
          name="description"
          content="Aplikace pro sledování vašich čtenářských aktivit a správu knih."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#111827" />
      </head>
      <body
        className={`${inter.variable} ${poppins.variable} font-sans min-h-screen flex flex-col bg-background antialiased`}
      >
        {/* Background elements with improved responsive positioning */}
        <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none z-[-1]"></div>

        <div className="bg-glow bg-glow-primary w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] fixed top-[10%] -left-[50px] sm:-left-[100px] opacity-30 z-[-1]"></div>
        <div className="bg-glow bg-glow-accent w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] fixed bottom-[5%] -right-[75px] sm:-right-[150px] opacity-20 bg-glow-pulse z-[-1]"></div>
        <div className="bg-glow bg-glow-primary w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] fixed top-[40%] right-[10%] sm:right-[20%] opacity-10 z-[-1]"></div>

        {/* Add a full-height background gradient overlay */}
        <div className="fixed inset-0 bg-gradient-to-b from-transparent via-background/5 to-background/10 pointer-events-none z-[-1]"></div>

        <Providers>
          <div className="flex-1 flex flex-col relative z-10">
            <NavbarWrapper />
            <main className="flex-1 max-w-full mx-auto pt-4 pb-16 md:pb-24 w-full relative z-10">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
