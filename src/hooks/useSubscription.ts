"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

export interface Subscription {
  tier: "free" | "basic" | "premium";
  startDate: Date;
  endDate?: Date;
  isYearly: boolean;
  aiCreditsRemaining: number;
  aiCreditsTotal: number;
  autoRenew: boolean;
  lastRenewalDate?: Date;
  nextRenewalDate?: Date;
}

export function useSubscription() {
  const { isAuthenticated, user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch the subscription data from the API
  const fetchSubscription = useCallback(async () => {
    if (!isAuthenticated) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/subscription");

      if (!response.ok) {
        if (response.status === 404) {
          // User not found (likely deleted)
          setSubscription(null);
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch subscription: ${response.statusText}`);
      }

      const data = await response.json();
      setSubscription(data.subscription);
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch subscription")
      );

      // Use fallback for free tier only if the error is not a 404
      if (!(err instanceof Error && err.message.includes("404"))) {
        setSubscription({
          tier: "free",
          startDate: new Date(),
          isYearly: false,
          aiCreditsRemaining: 3,
          aiCreditsTotal: 3,
          autoRenew: false,
          lastRenewalDate: new Date(),
          nextRenewalDate: new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          ),
        });
      } else {
        setSubscription(null);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Update the subscription tier and billing cycle
  const updateSubscription = async (
    tier: "free" | "basic" | "premium",
    isYearly?: boolean
  ) => {
    if (!isAuthenticated) {
      throw new Error("User must be authenticated to update subscription");
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier, isYearly }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update subscription: ${response.statusText}`
        );
      }

      const data = await response.json();
      setSubscription(data.subscription);
      return data.subscription;
    } catch (err) {
      console.error("Error updating subscription:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to update subscription")
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Use an AI credit
  const useAiCredit = async () => {
    if (!isAuthenticated) {
      throw new Error("User must be authenticated to use AI credits");
    }

    if (!subscription || subscription.aiCreditsRemaining <= 0) {
      throw new Error("No AI credits remaining");
    }

    try {
      const response = await fetch("/api/subscription/use-credit", {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error(`Failed to use AI credit: ${response.statusText}`);
      }

      const data = await response.json();

      // Update the local subscription state
      setSubscription((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          aiCreditsRemaining: data.creditsRemaining,
        };
      });

      return data.creditsRemaining;
    } catch (err) {
      console.error("Error using AI credit:", err);
      throw err;
    }
  };

  // Check if user has access to a specific feature
  const hasAccess = (feature: string): boolean => {
    if (!subscription) return false;

    const SUBSCRIPTION_LIMITS = {
      free: {
        maxBooks: 5,
        aiCreditsPerMonth: 3,
        exportToPdf: false,
        advancedNoteFormat: false,
        aiAuthorSummary: false,
        aiCustomization: false,
        detailedAuthorInfo: false,
        extendedAiSummary: false,
      },
      basic: {
        maxBooks: 50,
        aiCreditsPerMonth: 50,
        exportToPdf: true,
        advancedNoteFormat: true,
        aiAuthorSummary: true,
        aiCustomization: false,
        detailedAuthorInfo: false,
        extendedAiSummary: false,
      },
      premium: {
        maxBooks: Infinity,
        aiCreditsPerMonth: 100,
        exportToPdf: true,
        advancedNoteFormat: true,
        aiAuthorSummary: true,
        aiCustomization: true,
        detailedAuthorInfo: true,
        extendedAiSummary: true,
      },
    };

    return Boolean(
      SUBSCRIPTION_LIMITS[subscription.tier][
        feature as keyof typeof SUBSCRIPTION_LIMITS.free
      ]
    );
  };

  // Check if user has remaining AI credits
  const hasRemainingAiCredits = (): boolean => {
    return !!subscription && subscription.aiCreditsRemaining > 0;
  };

  // Fetch subscription when user changes
  useEffect(() => {
    fetchSubscription();
  }, [isAuthenticated, user, fetchSubscription]);

  return {
    subscription,
    loading,
    error,
    updateSubscription,
    useAiCredit,
    hasAccess,
    hasRemainingAiCredits,
    refreshSubscription: fetchSubscription,
  };
}
