import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { SummaryPreferencesProvider } from "@/contexts/SummaryPreferencesContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Čtenářský deník",
  description: "Vytvořte si deník a zaznamenejte si své čtení",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" className="h-full scroll-smooth">
      <body
        className={`${inter.variable} ${poppins.variable} font-sans min-h-full flex flex-col bg-background antialiased`}
      >
        <SummaryPreferencesProvider>
          <div className="flex-1 pb-16">{children}</div>
          <Footer />
        </SummaryPreferencesProvider>
      </body>
    </html>
  );
}
