import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

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
  language: "formal" | "casual";
  style: "academic" | "storytelling";
}

const defaultPreferences: SummaryPreferences = {
  includeCharacterAnalysis: true,
  includeHistoricalContext: true,
  includeThemes: true,
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
      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-base text-gray-900 mb-3">
            Obsah shrnutí
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <motion.label
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                preferences.includeCharacterAnalysis
                  ? "bg-blue-50 border-blue-200"
                  : "hover:bg-gray-50 border-gray-200"
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                  preferences.includeCharacterAnalysis
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-300"
                }`}
              >
                {preferences.includeCharacterAnalysis && (
                  <Check className="w-3.5 h-3.5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  Analýza postav
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Rozbor hlavních postav a jejich vývoje v díle
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.includeCharacterAnalysis}
                onChange={() => handleToggle("includeCharacterAnalysis")}
                className="sr-only"
              />
            </motion.label>

            <motion.label
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                preferences.includeHistoricalContext
                  ? "bg-blue-50 border-blue-200"
                  : "hover:bg-gray-50 border-gray-200"
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                  preferences.includeHistoricalContext
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-300"
                }`}
              >
                {preferences.includeHistoricalContext && (
                  <Check className="w-3.5 h-3.5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  Historický kontext
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Zasazení díla do historického a kulturního kontextu
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.includeHistoricalContext}
                onChange={() => handleToggle("includeHistoricalContext")}
                className="sr-only"
              />
            </motion.label>

            <motion.label
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                preferences.includeThemes
                  ? "bg-blue-50 border-blue-200"
                  : "hover:bg-gray-50 border-gray-200"
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                  preferences.includeThemes
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-300"
                }`}
              >
                {preferences.includeThemes && (
                  <Check className="w-3.5 h-3.5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  Témata a motivy
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Rozbor hlavních témat a motivů díla
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.includeThemes}
                onChange={() => handleToggle("includeThemes")}
                className="sr-only"
              />
            </motion.label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-base text-gray-900">Styl textu</h3>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Jazyk
            </label>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() =>
                  setPreferences((prev) => ({ ...prev, language: "formal" }))
                }
                className={`p-3 rounded-lg text-sm flex items-center justify-center gap-2 border transition-colors ${
                  preferences.language === "formal"
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    preferences.language === "formal"
                      ? "border-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {preferences.language === "formal" && (
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <span>Formální</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() =>
                  setPreferences((prev) => ({ ...prev, language: "casual" }))
                }
                className={`p-3 rounded-lg text-sm flex items-center justify-center gap-2 border transition-colors ${
                  preferences.language === "casual"
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    preferences.language === "casual"
                      ? "border-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {preferences.language === "casual" && (
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <span>Neformální</span>
              </motion.button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Přístup
            </label>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() =>
                  setPreferences((prev) => ({ ...prev, style: "academic" }))
                }
                className={`p-3 rounded-lg text-sm flex items-center justify-center gap-2 border transition-colors ${
                  preferences.style === "academic"
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    preferences.style === "academic"
                      ? "border-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {preferences.style === "academic" && (
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <span>Akademický</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() =>
                  setPreferences((prev) => ({ ...prev, style: "storytelling" }))
                }
                className={`p-3 rounded-lg text-sm flex items-center justify-center gap-2 border transition-colors ${
                  preferences.style === "storytelling"
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    preferences.style === "storytelling"
                      ? "border-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {preferences.style === "storytelling" && (
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <span>Vyprávěcí</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
