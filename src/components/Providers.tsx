"use client";

import React from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SummaryPreferencesProvider } from "@/contexts/SummaryPreferencesContext";
import SessionProvider from "@/components/SessionProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { Toaster } from "sonner";
import SubscriptionModal from "@/components/SubscriptionModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <SubscriptionProvider>
            <SummaryPreferencesProvider>
              {children}
              <Toaster position="top-center" />
              <SubscriptionModal />
            </SummaryPreferencesProvider>
          </SubscriptionProvider>
        </ThemeProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
