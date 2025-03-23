"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { hasAccess, SubscriptionFeature } from "@/types/user";

interface FeatureGateProps {
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
}

/**
 * A component that conditionally renders content based on whether the user has access to a feature.
 * If the user is not authenticated, it will render the fallback content.
 */
export default function FeatureGate({
  feature,
  children,
  fallback,
}: FeatureGateProps) {
  const { user, isAuthenticated } = useAuth();

  // If user is not authenticated, render fallback
  if (!isAuthenticated || !user) {
    return fallback ? <>{fallback}</> : null;
  }

  // Check if user has access to the feature
  const canAccess = hasAccess(user, feature);

  // Render children if user has access, otherwise render fallback
  return canAccess ? <>{children}</> : fallback ? <>{fallback}</> : null;
}

/**
 * A component that renders a premium feature upgrade prompt
 */
export function PremiumFeaturePrompt({
  feature,
}: {
  feature: SubscriptionFeature;
}) {
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

  const featureName = featureNames[feature] || feature;

  return (
    <div className="bg-[#1a2436] rounded-xl p-6 border border-[#2a3548] text-center">
      <h3 className="text-xl font-bold mb-2">Premium funkce</h3>
      <p className="text-gray-400 mb-4">
        Funkce <span className="text-white font-medium">{featureName}</span> je
        dostupná pouze pro uživatele s předplatným Premium.
      </p>
      <Link
        href="/subscription"
        className="inline-block px-6 py-2 bg-[#3b82f6] text-white rounded-full font-medium hover:bg-blue-600 transition-all"
      >
        Upgradovat na Premium
      </Link>
    </div>
  );
}

/**
 * A component that renders a basic feature upgrade prompt
 */
export function BasicFeaturePrompt({
  feature,
}: {
  feature: SubscriptionFeature;
}) {
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

  const featureName = featureNames[feature] || feature;

  return (
    <div className="bg-[#1a2436] rounded-xl p-6 border border-[#2a3548] text-center">
      <h3 className="text-xl font-bold mb-2">Rozšířená funkce</h3>
      <p className="text-gray-400 mb-4">
        Funkce <span className="text-white font-medium">{featureName}</span> je
        dostupná pouze pro uživatele s předplatným Basic nebo Premium.
      </p>
      <Link
        href="/subscription"
        className="inline-block px-6 py-2 bg-[#3b82f6] text-white rounded-full font-medium hover:bg-blue-600 transition-all"
      >
        Upgradovat na Basic
      </Link>
    </div>
  );
}

/**
 * A component that renders an AI credits exhausted prompt
 */
export function AiCreditsExhaustedPrompt() {
  return (
    <div className="p-6 max-w-full overflow-x-hidden">
      {/* Top decorative elements */}
      <div className="relative flex justify-center mb-8">
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-red-500/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-red-500/10 rounded-full blur-xl"></div>

        {/* Icon container with pulse animation */}
        <div className="relative">
          <div
            className="absolute inset-0 bg-red-500/10 rounded-full animate-ping opacity-50"
            style={{ animationDuration: "3s" }}
          ></div>
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 p-4 rounded-full relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-10 h-10 text-red-500"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-center mb-3 text-white">
        AI kredity vyčerpány
      </h3>

      <p className="text-gray-300 text-center mb-2">
        Vyčerpali jste všechny své AI kredity pro tento měsíc.
      </p>
      <p className="text-gray-400 text-sm text-center mb-6">
        Pro generování AI obsahu jsou potřeba kredity, které se obnovují každý
        měsíc podle vašeho předplatného.
      </p>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-800/30 rounded-lg p-3 border border-gray-700/50">
          <div className="flex items-start gap-3">
            <div className="bg-amber-500/10 p-2 rounded-full flex-shrink-0 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 text-amber-500"
              >
                <path
                  fillRule="evenodd"
                  d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-xs text-gray-300">
              Využili jste všechny své{" "}
              <span className="text-amber-400 font-medium">AI kredity</span> z
              předplatného. Další kredity budou k dispozici při dalším obnovení
              předplatného.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
        <Link
          href="/subscription"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white rounded-full font-medium hover:from-[#2563eb] hover:to-[#1d4ed8] transition-all shadow-md hover:shadow-lg transform hover:scale-105 duration-200 group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 mr-2 group-hover:animate-pulse"
          >
            <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
            <path
              fillRule="evenodd"
              d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z"
              clipRule="evenodd"
            />
          </svg>
          Upgradovat předplatné
        </Link>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.location.reload();
          }}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-transparent text-[#3b82f6] border border-[#3b82f6]/30 rounded-full font-medium hover:bg-[#3b82f6]/10 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 mr-2"
          >
            <path
              fillRule="evenodd"
              d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z"
              clipRule="evenodd"
            />
          </svg>
          Obnovit stránku
        </a>
      </div>
    </div>
  );
}

/**
 * A component that renders a book limit reached prompt
 */
export function BookLimitReachedPrompt() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="bg-[#1a2436] rounded-xl p-6 border border-[#2a3548] text-center">
      <h3 className="text-xl font-bold mb-2">Limit knih dosažen</h3>
      <p className="text-gray-400 mb-4">
        Dosáhli jste maximálního počtu knih pro vaše předplatné (
        {user.subscription.tier === "free" ? "5" : "50"}). Upgradujte své
        předplatné pro přidání více knih.
      </p>
      <Link
        href="/subscription"
        className="inline-block px-6 py-2 bg-[#3b82f6] text-white rounded-full font-medium hover:bg-blue-600 transition-all"
      >
        Upgradovat předplatné
      </Link>
    </div>
  );
}
