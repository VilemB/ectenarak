import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { motion } from "framer-motion";

interface SummaryPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (preferences: SummaryPreferences) => void;
  isLoading: boolean;
}

export interface SummaryPreferences {
  includeCharacterAnalysis: boolean;
  includeHistoricalContext: boolean;
  includeThemes: boolean;
  includePersonalOpinion: boolean;
  language: "formal" | "casual";
  style: "academic" | "storytelling";
}

const defaultPreferences: SummaryPreferences = {
  includeCharacterAnalysis: true,
  includeHistoricalContext: true,
  includeThemes: true,
  includePersonalOpinion: false,
  language: "formal",
  style: "academic",
};

export function SummaryPreferencesModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: SummaryPreferencesModalProps) {
  const [preferences, setPreferences] =
    useState<SummaryPreferences>(defaultPreferences);

  const handleToggle = (key: keyof SummaryPreferences) => {
    if (typeof preferences[key] === "boolean") {
      setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => onConfirm(preferences)}
      title="Nastavení shrnutí"
      description="Vyberte, co všechno má shrnutí obsahovat a jak má být napsáno."
      confirmText={isLoading ? "Generuji..." : "Generovat shrnutí"}
      confirmDisabled={isLoading}
    >
      <div className="space-y-6 py-4">
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-gray-700">Obsah shrnutí</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.includeCharacterAnalysis}
                onChange={() => handleToggle("includeCharacterAnalysis")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Analýza postav</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.includeHistoricalContext}
                onChange={() => handleToggle("includeHistoricalContext")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Historický kontext</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.includeThemes}
                onChange={() => handleToggle("includeThemes")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Témata a motivy</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.includePersonalOpinion}
                onChange={() => handleToggle("includePersonalOpinion")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                Osobní hodnocení díla
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-sm text-gray-700">Styl textu</h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Jazyk</label>
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    setPreferences((prev) => ({ ...prev, language: "formal" }))
                  }
                  className={`px-3 py-1 rounded-lg text-sm flex-1 ${
                    preferences.language === "formal"
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  } border`}
                >
                  Formální
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    setPreferences((prev) => ({ ...prev, language: "casual" }))
                  }
                  className={`px-3 py-1 rounded-lg text-sm flex-1 ${
                    preferences.language === "casual"
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  } border`}
                >
                  Neformální
                </motion.button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Přístup</label>
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    setPreferences((prev) => ({ ...prev, style: "academic" }))
                  }
                  className={`px-3 py-1 rounded-lg text-sm flex-1 ${
                    preferences.style === "academic"
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  } border`}
                >
                  Akademický
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    setPreferences((prev) => ({
                      ...prev,
                      style: "storytelling",
                    }))
                  }
                  className={`px-3 py-1 rounded-lg text-sm flex-1 ${
                    preferences.style === "storytelling"
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  } border`}
                >
                  Vyprávěcí
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
