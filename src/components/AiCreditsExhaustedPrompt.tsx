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
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl overflow-hidden border-2 border-amber-500/30 shadow-xl backdrop-blur-lg relative max-w-2xl mx-auto"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-black/80 z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 to-amber-800/20 z-0"></div>
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 z-0"></div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-amber-600 relative z-10"></div>

      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center text-center md:text-left">
          {/* Icon with animated pulse */}
          <div className="relative flex-shrink-0">
            <div
              className="absolute inset-0 bg-amber-500/40 rounded-full animate-ping opacity-70"
              style={{ animationDuration: "3s" }}
            ></div>
            <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center border border-amber-500/40 shadow-lg relative">
              <AlertTriangle size={28} className="text-white" />
            </div>
          </div>

          {/* Text content */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span>Vyčerpané AI kredity</span>
              <div className="inline-block px-2 py-0.5 text-xs font-medium bg-amber-700/80 text-white rounded-full border border-amber-500/40">
                0 zbývá
              </div>
            </h3>

            <div className="text-white space-y-4">
              <p>
                Nemáte dostatek AI kreditů pro {getFeatureName()}. Kredity se
                obnoví <span className="font-medium">{getNextResetDate()}</span>
                .
              </p>

              {/* Feature explanation */}
              <div className="bg-black/40 rounded-lg border border-amber-700/30 p-4">
                <h4 className="font-medium mb-2 flex items-center text-amber-300">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Co můžete udělat:
                </h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <div className="mt-0.5 mr-2 text-amber-400 font-bold">
                      1.
                    </div>
                    <span>Počkat na obnovu kreditů v příštím měsíci</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mt-0.5 mr-2 text-amber-400 font-bold">
                      2.
                    </div>
                    <span>
                      Upgradovat na{" "}
                      <strong>
                        {subscription?.tier === "free" ? "Basic" : "Premium"}
                      </strong>{" "}
                      předplatné (
                      {getCreditsPerTier(
                        subscription?.tier === "free" ? "basic" : "premium"
                      )}{" "}
                      kreditů/měsíc)
                    </span>
                  </li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link href="/subscription">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium px-4 py-2">
                    <span>Navýšit předplatné</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/20"
                  onClick={onClose}
                >
                  Rozumím
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
