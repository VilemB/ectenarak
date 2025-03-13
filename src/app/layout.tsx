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
    <html lang="cs" className="h-full scroll-smooth" suppressHydrationWarning>
      <head>
        <title>Čtenářský Deník</title>
        <meta
          name="description"
          content="Aplikace pro sledování vašich čtenářských aktivit a správu knih."
        />
      </head>
      <body
        className={`${inter.variable} ${poppins.variable} font-sans min-h-full flex flex-col bg-background antialiased`}
      >
        <Providers>
          <div className="flex-1 flex flex-col">
            <NavbarWrapper />
            <main className="flex-1 pb-8 relative z-10">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
