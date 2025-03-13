"use client";

import React from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SummaryPreferencesProvider } from "@/contexts/SummaryPreferencesContext";
import { SessionProvider } from "@/components/SessionProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SessionProvider>
          <SummaryPreferencesProvider>
            {children}
            <Toaster position="top-center" />
          </SummaryPreferencesProvider>
        </SessionProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
