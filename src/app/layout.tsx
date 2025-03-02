import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SummaryPreferencesProvider } from "@/contexts/SummaryPreferencesContext";
import { SessionProvider } from "@/components/SessionProvider";
import { Toaster } from "sonner";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Čtenářský deník",
  description: "Aplikace pro správu vašeho čtenářského deníku",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className="h-full scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} font-sans min-h-full flex flex-col bg-background antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <SummaryPreferencesProvider>
              <div className="flex-1 pb-16">{children}</div>
              <Footer />
              <Toaster position="top-center" />
            </SummaryPreferencesProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
