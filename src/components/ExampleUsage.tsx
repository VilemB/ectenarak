"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import FeatureGate, {
  PremiumFeaturePrompt,
  BasicFeaturePrompt,
  AiCreditsExhaustedPrompt,
} from "@/components/FeatureGate";
import { hasRemainingAiCredits } from "@/types/user";
import { motion } from "framer-motion";
import { Sparkles, Download } from "lucide-react";

export default function ExampleUsage() {
  const { user, useAiCredit: spendAiCredit } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState<string | null>(null);

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto"
    >
      {/* Interactive feature demos */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        <div className="bg-gradient-to-br from-[#1a2436] to-[#1a2436]/80 rounded-2xl p-6 border border-[#2a3548] shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center mb-4">
            <div className="bg-blue-500/20 p-3 rounded-xl mr-4 group-hover:bg-blue-500/30 transition-all duration-300">
              <Sparkles className="h-6 w-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold">AI Shrnutí knihy</h2>
          </div>

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
                    <div className="bg-[#2a3548]/50 p-4 rounded-xl text-gray-200 mb-4">
                      {generatedText}
                    </div>
                    <button
                      className="px-6 py-2 bg-[#2a3548] text-white rounded-full font-medium hover:bg-[#3b4659] transition-all"
                      onClick={() => setGeneratedText(null)}
                    >
                      Vygenerovat znovu
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400 mb-4">
                      Zbývající AI kredity:{" "}
                      <span className="text-blue-400 font-medium">
                        {user?.subscription.aiCreditsRemaining || 0} /{" "}
                        {user?.subscription.aiCreditsTotal || 0}
                      </span>
                    </p>
                    <button
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full font-medium transition-all shadow-lg hover:shadow-xl"
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
                        <span className="flex items-center">
                          <Sparkles className="mr-2 h-5 w-5" />
                          Vygenerovat AI shrnutí
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </FeatureGate>
        </div>

        <div className="bg-gradient-to-br from-[#1a2436] to-[#1a2436]/80 rounded-2xl p-6 border border-[#2a3548] shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center mb-4">
            <div className="bg-blue-500/20 p-3 rounded-xl mr-4 group-hover:bg-blue-500/30 transition-all duration-300">
              <Download className="h-6 w-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold">Export do PDF</h2>
          </div>

          <FeatureGate
            feature="exportToPdf"
            fallback={<BasicFeaturePrompt feature="exportToPdf" />}
          >
            <div>
              <p className="text-gray-400 mb-4">
                Exportujte své poznámky a statistiky do PDF formátu pro snadné
                sdílení nebo tisk.
              </p>
              <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full font-medium transition-all shadow-lg hover:shadow-xl">
                <span className="flex items-center">
                  <Download className="mr-2 h-5 w-5" />
                  Exportovat do PDF
                </span>
              </button>
            </div>
          </FeatureGate>
        </div>
      </motion.div>
    </motion.div>
  );
}
