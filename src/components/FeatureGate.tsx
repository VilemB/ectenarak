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
    <div className="bg-[#1a2436] rounded-xl p-6 border border-[#2a3548] text-center">
      <h3 className="text-xl font-bold mb-2">AI kredity vyčerpány</h3>
      <p className="text-gray-400 mb-4">
        Vyčerpali jste všechny své AI kredity pro tento měsíc. Upgradujte své
        předplatné pro získání více kreditů.
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
