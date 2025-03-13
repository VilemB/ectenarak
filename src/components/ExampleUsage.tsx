"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import FeatureGate, {
  PremiumFeaturePrompt,
  BasicFeaturePrompt,
  AiCreditsExhaustedPrompt,
  BookLimitReachedPrompt,
} from "@/components/FeatureGate";
import { hasRemainingAiCredits, hasReachedBookLimit } from "@/types/user";

export default function ExampleUsage() {
  const { user, useAiCredit: spendAiCredit } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState<string | null>(null);

  // Example book count for demonstration
  const currentBookCount = 4;

  const handleGenerateAiSummary = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      // Check if user has AI credits remaining
      if (!hasRemainingAiCredits(user)) {
        return;
      }

      // Use an AI credit
      const success = await spendAiCredit();
      if (!success) {
        return;
      }

      // Simulate AI generation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setGeneratedText(
        "Toto je ukázkové AI shrnutí knihy. V reálné aplikaci by zde byl skutečný obsah generovaný pomocí AI."
      );
    } catch (error) {
      console.error("Failed to generate AI summary:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Ukázka použití předplatného</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-[#1a2436] rounded-xl p-6 border border-[#2a3548]">
          <h2 className="text-xl font-bold mb-4">Přidat novou knihu</h2>

          {user && hasReachedBookLimit(user, currentBookCount) ? (
            <BookLimitReachedPrompt />
          ) : (
            <div>
              <p className="text-gray-400 mb-4">
                Aktuální počet knih: {currentBookCount}
              </p>
              <button className="px-6 py-2 bg-[#3b82f6] text-white rounded-full font-medium hover:bg-blue-600 transition-all">
                Přidat knihu
              </button>
            </div>
          )}
        </div>

        <div className="bg-[#1a2436] rounded-xl p-6 border border-[#2a3548]">
          <h2 className="text-xl font-bold mb-4">AI Shrnutí knihy</h2>

          <FeatureGate
            feature="aiAuthorSummary"
            fallback={
              user?.subscription.tier === "free" ? (
                <BasicFeaturePrompt feature="aiAuthorSummary" />
              ) : (
                <PremiumFeaturePrompt feature="aiAuthorSummary" />
              )
            }
          >
            {user && !hasRemainingAiCredits(user) ? (
              <AiCreditsExhaustedPrompt />
            ) : (
              <div>
                {generatedText ? (
                  <div className="mb-4">
                    <p className="text-gray-200">{generatedText}</p>
                    <button
                      className="mt-4 px-6 py-2 bg-[#2a3548] text-white rounded-full font-medium hover:bg-[#3b4659] transition-all"
                      onClick={() => setGeneratedText(null)}
                    >
                      Vygenerovat znovu
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400 mb-4">
                      Zbývající AI kredity:{" "}
                      {user?.subscription.aiCreditsRemaining || 0} /{" "}
                      {user?.subscription.aiCreditsTotal || 0}
                    </p>
                    <button
                      className="px-6 py-2 bg-[#3b82f6] text-white rounded-full font-medium hover:bg-blue-600 transition-all"
                      onClick={handleGenerateAiSummary}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Generuji...
                        </span>
                      ) : (
                        "Vygenerovat AI shrnutí"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </FeatureGate>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#1a2436] rounded-xl p-6 border border-[#2a3548]">
          <h2 className="text-xl font-bold mb-4">Export do PDF</h2>

          <FeatureGate
            feature="exportToPdf"
            fallback={<BasicFeaturePrompt feature="exportToPdf" />}
          >
            <div>
              <p className="text-gray-400 mb-4">
                Exportujte své poznámky a statistiky do PDF formátu.
              </p>
              <button className="px-6 py-2 bg-[#3b82f6] text-white rounded-full font-medium hover:bg-blue-600 transition-all">
                Exportovat do PDF
              </button>
            </div>
          </FeatureGate>
        </div>

        <div className="bg-[#1a2436] rounded-xl p-6 border border-[#2a3548]">
          <h2 className="text-xl font-bold mb-4">
            Detailní informace o autorovi
          </h2>

          <FeatureGate
            feature="detailedAuthorInfo"
            fallback={<PremiumFeaturePrompt feature="detailedAuthorInfo" />}
          >
            <div>
              <p className="text-gray-400 mb-4">
                Získejte podrobné informace o autorovi, včetně bibliografie,
                ocenění a zajímavostí.
              </p>
              <button className="px-6 py-2 bg-[#3b82f6] text-white rounded-full font-medium hover:bg-blue-600 transition-all">
                Zobrazit detaily
              </button>
            </div>
          </FeatureGate>
        </div>
      </div>
    </div>
  );
}
