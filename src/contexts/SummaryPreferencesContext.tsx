"use client";

import { createContext, useContext, ReactNode } from "react";
import { SummaryPreferences } from "@/components/SummaryPreferencesModal";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface SummaryPreferencesContextType {
  preferences: SummaryPreferences;
  setPreferences: (preferences: SummaryPreferences) => void;
}

const SummaryPreferencesContext = createContext<
  SummaryPreferencesContextType | undefined
>(undefined);

export function SummaryPreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useLocalStorage<SummaryPreferences>(
    "global-summary-preferences",
    {
      style: "academic",
      length: "medium",
      focus: "balanced",
      language: "cs",
      examFocus: false,
      literaryContext: false,
      studyGuide: false,
    }
  );

  return (
    <SummaryPreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </SummaryPreferencesContext.Provider>
  );
}

export function useSummaryPreferences() {
  const context = useContext(SummaryPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useSummaryPreferences must be used within a SummaryPreferencesProvider"
    );
  }
  return context;
}
