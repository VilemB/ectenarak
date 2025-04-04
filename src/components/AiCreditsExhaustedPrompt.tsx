"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

interface AiCreditsExhaustedPromptProps {
  onClose: () => void;
  feature?: "aiSummary" | "aiAuthorSummary" | "aiCustomization";
}

export default function AiCreditsExhaustedPrompt({
  onClose,
  feature = "aiSummary",
}: AiCreditsExhaustedPromptProps) {
  const { subscription } = useSubscription();

  // Get the appropriate feature name based on the type
  const getFeatureName = () => {
    switch (feature) {
      case "aiSummary":
        return "generování AI shrnutí";
      case "aiAuthorSummary":
        return "získání informací o autorovi";
      case "aiCustomization":
        return "AI funkce";
      default:
        return "AI funkce";
    }
  };

  // Define the next credit reset date (first day of next month)
  const getNextResetDate = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Define how many credits user gets per month based on subscription tier
  const getCreditsPerTier = (tier: "free" | "basic" | "premium") => {
    switch (tier) {
      case "free":
        return 3;
      case "basic":
        return 50;
      case "premium":
        return 100;
      default:
        return 0;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-lg overflow-hidden shadow-xl relative max-w-lg mx-auto border border-zinc-800/50"
    >
      {/* Simple top accent line */}
      <div className="h-1 w-full bg-amber-500"></div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping"></div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">
              Vyčerpané AI kredity
            </h3>
            <p className="text-sm text-zinc-400">
              Nemáte dostatek kreditů pro {getFeatureName()}
            </p>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-zinc-900/50 rounded-lg p-4 mb-6 border border-zinc-800/50">
          <div className="flex items-start gap-3 text-sm text-zinc-300">
            <Sparkles className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p>
                Kredity se obnoví{" "}
                <span className="font-medium text-zinc-100">
                  {getNextResetDate()}
                </span>
              </p>
              <p className="mt-2">
                Nebo můžete upgradovat na{" "}
                <span className="font-medium text-zinc-100">
                  {subscription?.tier === "free" ? "Basic" : "Premium"}
                </span>{" "}
                předplatné a získat{" "}
                <span className="font-medium text-zinc-100">
                  {getCreditsPerTier(
                    subscription?.tier === "free" ? "basic" : "premium"
                  )}
                </span>{" "}
                kreditů měsíčně.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50"
          >
            Rozumím
          </Button>
          <Link href="/subscription" className="sm:ml-3">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white">
              Navýšit předplatné
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
