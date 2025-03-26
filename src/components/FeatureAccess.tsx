"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, AlertTriangle, ArrowRight } from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { SubscriptionFeature } from "@/types/user";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface FeatureAccessProps {
  /**
   * The feature to check access for
   */
  feature: SubscriptionFeature;
  /**
   * Content to render if the user has access to the feature
   */
  children: React.ReactNode;
  /**
   * Optional content to render if the user does not have access to the feature
   */
  fallback?: React.ReactNode;
  /**
   * Optional minimum subscription tier required for this feature
   * If provided, will customize the upgrade prompt accordingly
   */
  requiredTier?: "basic" | "premium";
  /**
   * Option to show a simple lock icon instead of the full upgrade prompt
   */
  showLockOnly?: boolean;
  /**
   * Optional custom message for the prompt
   */
  customMessage?: string;
  /**
   * Option to show a tooltip instead of the lock icon
   */
  showTooltip?: boolean;
}

const featureNames: Record<SubscriptionFeature, string> = {
  maxBooks: "Maximální počet knih",
  aiCreditsPerMonth: "AI kredity za měsíc",
  exportToPdf: "Export do PDF",
  advancedNoteFormat: "Pokročilý formát poznámek",
  aiAuthorSummary: "AI shrnutí autora",
  aiCustomization: "AI přizpůsobení",
  detailedAuthorInfo: "Detailní informace o autorovi",
  extendedAiSummary: "Rozšířené AI shrnutí",
};

/**
 * A component that conditionally renders content based on subscription tier access
 */
export function FeatureAccess({
  feature,
  children,
  fallback,
  requiredTier = "basic",
  showLockOnly = false,
  customMessage,
  showTooltip = true,
}: FeatureAccessProps) {
  const { canAccess, isLoading } = useFeatureAccess();

  // While loading, show a placeholder
  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-800/50 rounded-lg h-24 flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Načítání...</span>
      </div>
    );
  }

  // Check if user has access to the feature
  const hasAccess = canAccess(feature);

  // If they have access, render the children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If fallback is provided, use that
  if (fallback) {
    return <>{fallback}</>;
  }

  // If requested to show lock only
  if (showLockOnly) {
    return (
      <FeatureLockIndicator
        feature={feature}
        requiredTier={requiredTier}
        customMessage={customMessage}
      />
    );
  }

  // Otherwise show the subscription upgrade prompt
  return (
    <FeatureUpgradePrompt
      feature={feature}
      requiredTier={requiredTier}
      customMessage={customMessage}
      showTooltip={showTooltip}
    >
      {children}
    </FeatureUpgradePrompt>
  );
}

// Shared tooltip content component to maintain consistent style
function FeatureTooltipContent({
  feature,
  requiredTier,
  customMessage,
}: {
  feature: SubscriptionFeature;
  requiredTier: "basic" | "premium";
  customMessage?: string;
}) {
  return (
    <div className="max-w-[300px] p-4 text-center">
      <h3 className="text-lg font-semibold mb-2">
        {requiredTier === "basic" ? "Basic funkce" : "Premium funkce"}
      </h3>
      <p className="text-sm text-gray-300 mb-4">
        {customMessage ||
          `Pro přístup k ${featureNames[feature]} potřebujete ${
            requiredTier === "basic" ? "Basic" : "Premium"
          } předplatné.`}
      </p>
      <Link href="/subscription">
        <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500">
          Upgradovat na {requiredTier === "basic" ? "Basic" : "Premium"}
        </Button>
      </Link>
    </div>
  );
}

/**
 * A simple lock indicator for premium features with tooltip on button hover only
 */
export function FeatureLockIndicator({
  feature,
  requiredTier = "premium",
  customMessage,
}: {
  feature: SubscriptionFeature;
  requiredTier?: "basic" | "premium";
  customMessage?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 p-1 shadow-sm flex items-center justify-center transition-all duration-300 hover:scale-110">
              <Lock size={10} className="text-white/70" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="bg-[#1a2436] border border-[#2a3548]"
        >
          <FeatureTooltipContent
            feature={feature}
            requiredTier={requiredTier}
            customMessage={customMessage}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * A component that renders a subscription upgrade prompt
 */
export function FeatureUpgradePrompt({
  feature,
  requiredTier = "basic",
  customMessage,
  children,
  showTooltip = true,
}: {
  feature: SubscriptionFeature;
  requiredTier?: "basic" | "premium";
  customMessage?: string;
  children?: React.ReactNode;
  showTooltip?: boolean;
}) {
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative group">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Lock className="h-5 w-5 text-white/70" />
              </div>
              {children}
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="center"
            className="bg-[#1a2436] border border-[#2a3548]"
          >
            <FeatureTooltipContent
              feature={feature}
              requiredTier={requiredTier}
              customMessage={customMessage}
            />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="bg-[#1a2436] rounded-xl p-6 border border-[#2a3548] text-center">
      <FeatureTooltipContent
        feature={feature}
        requiredTier={requiredTier}
        customMessage={customMessage}
      />
    </div>
  );
}

/**
 * A component that indicates when AI credits are exhausted
 */
export function AiCreditsExhausted() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl overflow-hidden border border-amber-500/30 shadow-xl backdrop-blur-lg relative"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-black/80 z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 to-amber-800/20 z-0"></div>
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 z-0"></div>
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>

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
            <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center md:justify-start">
              <span>Vyčerpány AI kredity</span>
              <div className="inline-block ml-2 px-2 py-0.5 text-xs font-medium bg-amber-700/80 text-white rounded-full border border-amber-500/40">
                0 zbývá
              </div>
            </h3>

            <div className="text-white space-y-4">
              <p>
                Použili jste všechny své AI kredity na tento měsíc. Kredity se
                používají při:
              </p>

              {/* Features that use credits */}
              <div className="bg-black/40 rounded-lg border border-amber-700/30 p-3">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <div className="mt-0.5 mr-2 text-amber-400">•</div>
                    <span>Generování AI shrnutí knihy</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mt-0.5 mr-2 text-amber-400">•</div>
                    <span>Získávání informací o autorovi</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mt-0.5 mr-2 text-amber-400">•</div>
                    <span>Další AI funkce v aplikaci</span>
                  </li>
                </ul>
              </div>

              {/* Options */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link
                  href="/subscription"
                  className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <span>Navýšit předplatné</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>

                <button className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg border border-white/20 font-medium transition-all">
                  Rozumím
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
