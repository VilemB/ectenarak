"use client";

import React from "react";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { SubscriptionFeature } from "@/types/user";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * An improved lock indicator for premium features with better visibility
 */
export default function PremiumFeatureLock({
  feature,
  requiredTier = "premium",
  customMessage,
  placement = { top: "-4px", right: "-4px" },
  hasAiCredits,
}: {
  feature: SubscriptionFeature;
  requiredTier?: "basic" | "premium";
  customMessage?: string;
  placement?: { top?: string; right?: string; bottom?: string; left?: string };
  hasAiCredits: boolean;
}) {
  // Define feature names for display
  const featureNames: Record<SubscriptionFeature, string> = {
    aiAuthorSummary: "AI shrnutí autora",
    aiCustomization: "AI přizpůsobení",
    advancedNoteFormat: "Pokročilý formát poznámek",
    exportToPdf: "Export do PDF",
    detailedAuthorInfo: "Detailní informace o autorovi",
    extendedAiSummary: "Rozšířené AI shrnutí",
    maxBooks: "Maximální počet knih",
    aiCreditsPerMonth: "AI kredity měsíčně",
  };

  const tierColors = {
    basic: {
      gradient: "from-blue-500 to-blue-600",
      glow: "rgba(59, 130, 246, 0.5)", // blue-500 with opacity
    },
    premium: {
      gradient: "from-purple-500 to-indigo-600",
      glow: "rgba(147, 51, 234, 0.5)", // purple-500 with opacity
    },
  };

  const isAiFeature =
    feature === "aiAuthorSummary" ||
    feature === "aiCustomization" ||
    feature === "extendedAiSummary";

  // If it's an AI feature and user still has credits, don't show the lock
  if (isAiFeature && hasAiCredits) {
    return null;
  }

  // Handler to show subscription modal when clicked
  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Dispatch the subscription modal event with appropriate parameters
    window.dispatchEvent(
      new CustomEvent("show-subscription-modal", {
        detail: {
          feature,
          needsCredits: isAiFeature && !hasAiCredits,
          creditsOnly: isAiFeature && !hasAiCredits,
        },
      })
    );
  };

  // Determine the message to display
  const getFeatureMessage = () => {
    // For AI features where the user has subscription access but no credits
    if (isAiFeature && !hasAiCredits) {
      return "Došly vám AI kredity. Pro získání kreditů si upgradujte předplatné.";
    }

    // For locked features (subscription required)
    return (
      customMessage || (
        <>
          Pro přístup k{" "}
          <span className="font-medium text-white">
            {featureNames[feature]}
          </span>{" "}
          potřebujete {requiredTier === "premium" ? "Premium" : "Basic"}{" "}
          předplatné.
        </>
      )
    );
  };

  return (
    <div className="absolute z-20" style={{ ...placement }}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`w-5 h-5 rounded-full bg-gradient-to-br ${tierColors[requiredTier].gradient} p-0.5 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg border border-white/30 cursor-pointer group`}
              style={{
                boxShadow: `0 0 8px 2px ${tierColors[requiredTier].glow}`,
              }}
              onClick={handleLockClick}
            >
              <Lock
                size={10}
                className="text-white group-hover:text-white/90"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="center"
            className="bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-md border border-white/20 p-0 overflow-hidden w-60"
          >
            <div className="w-full">
              {/* Header with tier badge */}
              <div className="px-3 py-2 border-b border-white/20 flex items-center">
                <div
                  className={`text-xs font-semibold mr-2 px-2 py-0.5 rounded-full bg-gradient-to-r ${tierColors[requiredTier].gradient}`}
                >
                  {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
                </div>
                <div className="text-sm font-medium">
                  {isAiFeature && !hasAiCredits ? "AI Kredity" : "Funkce"}
                </div>
              </div>

              {/* Content */}
              <div className="p-3 bg-black/60">
                <p className="text-sm text-white">{getFeatureMessage()}</p>

                {/* Action button */}
                <Link
                  href="/subscription"
                  className={`mt-3 text-sm flex items-center justify-center w-full bg-gradient-to-r ${tierColors[requiredTier].gradient} px-3 py-1.5 rounded-md font-medium hover:opacity-90 transition-opacity`}
                >
                  Upgradovat
                  <ArrowRight size={12} className="ml-1" />
                </Link>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
