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
  title: "Čtenářský deník | AI-Powered Digitální Čtenářský Deník pro Maturitu",
  description:
    "Moderní čtenářský deník s umělou inteligencí. Generujte AI shrnutí knih, analýzy autorů a exportujte poznámky pro maturitu. Ideální pro studenty středních škol, přípravu na maturitu a milovníky literatury. Vytvořte si digitální čtenářský deník s pokročilými AI funkcemi.",
  keywords:
    "čtenářský deník, maturita, knihy, literatura, AI shrnutí, analýza autorů, export poznámek, digitální deník, střední škola, maturitní četba, AI asistent, generování shrnutí, literární analýza, školní četba, maturitní otázky, čtenářský deník online, digitální čtenářský deník, AI pro studenty, maturitní příprava, literatura pro maturitu",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#f97316",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Čtenářský deník",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    minimumScale: 1,
  },
  openGraph: {
    title:
      "Čtenářský deník | AI-Powered Digitální Čtenářský Deník pro Maturitu",
    description:
      "Moderní čtenářský deník s umělou inteligencí. Generujte AI shrnutí knih, analýzy autorů a exportujte poznámky pro maturitu. Ideální pro studenty středních škol a přípravu na maturitu.",
    type: "website",
    locale: "cs_CZ",
    siteName: "Čtenářský deník",
    images: [
      {
        url: "https://ctenarsky-denik.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Čtenářský deník - AI-Powered Digitální Čtenářský Deník",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Čtenářský deník | AI-Powered Digitální Čtenářský Deník pro Maturitu",
    description:
      "Moderní čtenářský deník s umělou inteligencí. Generujte AI shrnutí knih, analýzy autorů a exportujte poznámky pro maturitu.",
    images: ["https://ctenarsky-denik.vercel.app/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://ctenarsky-denik.vercel.app",
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#f97316" />
        <meta name="msapplication-TileColor" content="#f97316" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`${inter.variable} font-sans antialiased root-layout`}>
        <Providers>
          <div className="flex flex-col min-h-screen relative z-10 w-full">
            <NavbarWrapper />
            <main className="flex-1 flex flex-col w-full">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
