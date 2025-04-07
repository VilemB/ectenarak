"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  SubscriptionTier,
  SUBSCRIPTION_LIMITS,
  SUBSCRIPTION_PRICING,
} from "@/types/user";
import { useRouter } from "next/navigation";
import AiCreditsDisplay from "./AiCreditsDisplay";
import LoginForm from "./LoginForm";

export default function SubscriptionManager() {
  const { user, updateSubscription, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Debug logging
  console.log("SubscriptionManager - Auth state:", {
    userExists: !!user,
    userData: user,
    isLoading,
    isAuthenticated,
  });

  // Show login form if not authenticated
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Pro správu předplatného se prosím přihlaste
        </h2>
        <LoginForm />
      </div>
    );
  }

  // Ensure user exists
  if (!user) {
    return null;
  }

  // Only set state if user exists
  const [isYearly, setIsYearly] = useState<boolean>(
    user.subscription?.isYearly || false
  );
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    user.subscription?.tier || "free"
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleSubscriptionChange = async () => {
    if (
      selectedTier === user.subscription.tier &&
      isYearly === user.subscription.isYearly
    ) {
      return; // No change
    }

    setIsProcessing(true);
    try {
      await updateSubscription(selectedTier, isYearly);
    } catch (error) {
      console.error("Failed to update subscription:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPrice = (tier: SubscriptionTier) => {
    if (tier === "free") return "0 Kč";
    const pricing = SUBSCRIPTION_PRICING[tier];
    const price = isYearly ? pricing.yearly : pricing.monthly;
    return `${price} Kč${isYearly ? "/rok" : "/měsíc"}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("cs-CZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Správa předplatného</h1>

      <div className="bg-[#1a2436] rounded-xl p-6 mb-8 border border-[#2a3548]">
        <h2 className="text-xl font-semibold mb-4">Aktuální předplatné</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-400 mb-1">Typ předplatného</p>
            <p className="text-xl font-medium">
              {user.subscription.tier === "free"
                ? "Zdarma"
                : user.subscription.tier === "basic"
                ? "Základní"
                : "Premium"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Platnost od</p>
            <p className="text-xl font-medium">
              {formatDate(user.subscription.startDate)}
            </p>
          </div>
          {user.subscription.tier !== "free" && (
            <>
              <div>
                <p className="text-gray-400 mb-1">Fakturační období</p>
                <p className="text-xl font-medium">
                  {user.subscription.isYearly ? "Ročně" : "Měsíčně"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Automatické obnovení</p>
                <p className="text-xl font-medium">
                  {user.subscription.autoRenew ? "Zapnuto" : "Vypnuto"}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-[#2a3548]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-gray-400">AI kredity</p>
            <div
              className="text-xs px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400 border border-amber-800/30"
              title="AI kredity se obnoví při dalším zúčtovacím období"
            >
              Obnova: {new Date(user.subscription.startDate).getDate()}.{" "}
              {new Date(user.subscription.startDate).toLocaleString("cs-CZ", {
                month: "short",
              })}
            </div>
          </div>
          <div className="flex items-center">
            <AiCreditsDisplay
              aiCreditsRemaining={user.subscription.aiCreditsRemaining}
              aiCreditsTotal={user.subscription.aiCreditsTotal}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6">Změnit předplatné</h2>

      <div className="flex justify-center mb-8">
        <div className="bg-[#1a2436] rounded-full p-1 inline-flex">
          <button
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              !isYearly
                ? "bg-[#3b82f6] text-white"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setIsYearly(false)}
          >
            Měsíčně
          </button>
          <button
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              isYearly
                ? "bg-[#3b82f6] text-white"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setIsYearly(true)}
          >
            Ročně
            <span className="ml-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
              Ušetříte 20%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Free Plan */}
        <div
          className={`bg-[#1a2436] rounded-xl p-6 border ${
            selectedTier === "free"
              ? "border-[#3b82f6] border-2"
              : "border-[#2a3548]"
          } relative`}
        >
          <div className="absolute top-3 right-3 bg-[#2a3548] text-xs font-medium px-3 py-1 rounded-full">
            Zdarma
          </div>
          <h3 className="text-xl font-bold mt-6 mb-2">Free</h3>
          <p className="text-4xl font-bold mb-4">0 Kč</p>
          <button
            className={`w-full py-3 rounded-full font-medium mb-6 ${
              selectedTier === "free"
                ? "bg-[#3b82f6] text-white"
                : "bg-[#2a3548] text-white hover:bg-[#3b82f6] transition-all"
            }`}
            onClick={() => setSelectedTier("free")}
            disabled={isLoading || isProcessing}
          >
            {selectedTier === "free" ? "Vybráno" : "Vybrat"}
          </button>

          <div className="border-t border-[#2a3548] pt-4 mb-4">
            <p className="text-xs uppercase tracking-wider mb-4 font-medium text-[#6b7280]">
              ZAHRNUJE
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
                  <svg
                    className="w-4 h-4 text-[#3b82f6]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <span>
                  Až {SUBSCRIPTION_LIMITS.free.maxBooks} knih v knihovně
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
                  <svg
                    className="w-4 h-4 text-[#3b82f6]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <span>Manuální poznámky</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
                  <svg
                    className="w-4 h-4 text-[#3b82f6]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <span>
                  {SUBSCRIPTION_LIMITS.free.aiCreditsPerMonth} AI kredity
                  měsíčně
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Basic Plan */}
        <div
          className={`bg-[#1a2436] rounded-xl p-6 border ${
            selectedTier === "basic"
              ? "border-[#3b82f6] border-2"
              : "border-[#2a3548]"
          } relative`}
        >
          <div className="absolute top-3 right-3 bg-[#2a3548] text-[#3b82f6] text-xs font-medium px-3 py-1 rounded-full">
            Populární
          </div>
          <h3 className="text-xl font-bold mt-6 mb-2">Basic</h3>
          <p className="text-4xl font-bold mb-4">{getPrice("basic")}</p>
          <button
            className={`w-full py-3 rounded-full font-medium mb-6 ${
              selectedTier === "basic"
                ? "bg-[#3b82f6] text-white"
                : "bg-[#2a3548] text-white hover:bg-[#3b82f6] transition-all"
            }`}
            onClick={() => setSelectedTier("basic")}
            disabled={isLoading || isProcessing}
          >
            {selectedTier === "basic" ? "Vybráno" : "Vybrat"}
          </button>

          <div className="border-t border-[#2a3548] pt-4 mb-4">
            <p className="text-xs uppercase tracking-wider mb-4 font-medium text-[#3b82f6]">
              ZAHRNUJE
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
                  <svg
                    className="w-4 h-4 text-[#3b82f6]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <span>
                  Až {SUBSCRIPTION_LIMITS.basic.maxBooks} knih v knihovně
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
                  <svg
                    className="w-4 h-4 text-[#3b82f6]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <span>
                  {SUBSCRIPTION_LIMITS.basic.aiCreditsPerMonth} AI kreditů
                  měsíčně
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
                  <svg
                    className="w-4 h-4 text-[#3b82f6]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <span>Export poznámek do PDF</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Premium Plan */}
        <div
          className={`bg-[#1a2436] rounded-xl p-6 border ${
            selectedTier === "premium"
              ? "border-[#3b82f6] border-2"
              : "border-[#2a3548]"
          } relative`}
        >
          <div className="absolute top-3 right-3 bg-[#3b82f6] text-white text-xs font-medium px-3 py-1 rounded-full">
            Doporučeno
          </div>
          <h3 className="text-xl font-bold mt-6 mb-2">Premium</h3>
          <p className="text-4xl font-bold mb-4">{getPrice("premium")}</p>
          <button
            className={`w-full py-3 rounded-full font-medium mb-6 ${
              selectedTier === "premium"
                ? "bg-[#3b82f6] text-white"
                : "bg-[#2a3548] text-white hover:bg-[#3b82f6] transition-all"
            }`}
            onClick={() => setSelectedTier("premium")}
            disabled={isLoading || isProcessing}
          >
            {selectedTier === "premium" ? "Vybráno" : "Vybrat"}
          </button>

          <div className="border-t border-[#2a3548] pt-4 mb-4">
            <p className="text-xs uppercase tracking-wider mb-4 font-medium text-[#3b82f6]">
              ZAHRNUJE
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
                  <svg
                    className="w-4 h-4 text-[#3b82f6]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <span>Neomezený počet knih v knihovně</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
                  <svg
                    className="w-4 h-4 text-[#3b82f6]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <span>
                  {SUBSCRIPTION_LIMITS.premium.aiCreditsPerMonth} AI kreditů
                  měsíčně
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
                  <svg
                    className="w-4 h-4 text-[#3b82f6]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <span>Prioritní podpora</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
                  <svg
                    className="w-4 h-4 text-[#3b82f6]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <span>Přizpůsobění AI shrnutí</span>
              </li>
              <li className="flex items-start pl-8 text-sm text-gray-400">
                <span>• Zaměření shrnutí</span>
              </li>
              <li className="flex items-start pl-8 text-sm text-gray-400">
                <span>• Detailní shrnutí</span>
              </li>
              <li className="flex items-start pl-8 text-sm text-gray-400">
                <span>• Styl shrnutí</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          className={`px-8 py-3 rounded-full font-medium relative overflow-hidden ${
            selectedTier === user.subscription.tier &&
            isYearly === user.subscription.isYearly
              ? "bg-gray-700 text-gray-300"
              : "bg-[#3b82f6] text-white hover:bg-blue-600 transition-all"
          }`}
          onClick={handleSubscriptionChange}
          disabled={
            isLoading ||
            isProcessing ||
            (selectedTier === user.subscription.tier &&
              isYearly === user.subscription.isYearly)
          }
        >
          {isProcessing && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="animate-shine absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>
          )}

          {isProcessing ? (
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
              Zpracování...
            </span>
          ) : (
            "Aktualizovat předplatné"
          )}
        </button>
      </div>
    </div>
  );
}
