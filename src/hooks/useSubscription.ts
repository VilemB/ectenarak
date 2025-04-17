"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserSubscription } from "@/types/user";

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
  const { isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch the subscription data from the API
  const refreshSubscription =
    useCallback(async (): Promise<UserSubscription | null> => {
      if (!isAuthenticated) {
        setSubscription(null);
        setLoading(false);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/subscription");

        if (!response.ok) {
          if (response.status === 404) {
            setSubscription(null);
            setLoading(false);
            return null;
          }
          throw new Error(
            `Failed to fetch subscription: ${response.statusText}`
          );
        }

        const data = await response.json();
        const fetchedSubscription =
          data.subscription as UserSubscription | null;
        setSubscription(fetchedSubscription);
        return fetchedSubscription;
      } catch (err) {
        console.error("Error fetching subscription:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to fetch subscription")
        );

        setSubscription(null);
        return null;
      } finally {
        setLoading(false);
      }
    }, [isAuthenticated]);

  // Effect to fetch initial subscription
  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  // Update the subscription tier and billing cycle (API call only, webhook handles DB)
  const updateSubscriptionApi = async (
    priceId: string
  ): Promise<{ success: boolean; subscriptionId?: string }> => {
    if (!isAuthenticated) {
      throw new Error("User must be authenticated to update subscription");
    }

    setError(null);

    try {
      const response = await fetch("/api/update-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update subscription via API");
      }

      return { success: true, subscriptionId: data.subscriptionId };
    } catch (err) {
      console.error("Error calling update subscription API:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to update subscription")
      );
      throw err;
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

  return {
    subscription,
    loading,
    error,
    refreshSubscription,
    updateSubscriptionApi,
    useAiCredit,
    hasAccess,
    hasRemainingAiCredits,
  };
}
