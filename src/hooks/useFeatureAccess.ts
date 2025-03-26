"use client";

import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionFeature, SUBSCRIPTION_LIMITS } from "@/types/user";
import { useCallback } from "react";

/**
 * A hook that provides utilities for checking feature access based on subscription tier
 */
export function useFeatureAccess() {
  const { user, isAuthenticated } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();

  /**
   * Check if the user has access to a specific feature
   */
  const canAccess = useCallback(
    (feature: SubscriptionFeature): boolean => {
      // If user is not authenticated, they don't have access to premium features
      if (!isAuthenticated || !user) return false;

      // If we have a subscription from the hook, use that as it's more up-to-date
      if (subscription) {
        return Boolean(SUBSCRIPTION_LIMITS[subscription.tier][feature]);
      }

      // Fallback to the user's subscription from the auth hook
      if (user.subscription) {
        return Boolean(SUBSCRIPTION_LIMITS[user.subscription.tier][feature]);
      }

      // Default to free tier if no subscription is found
      return Boolean(SUBSCRIPTION_LIMITS.free[feature]);
    },
    [isAuthenticated, user, subscription]
  );

  /**
   * Check if the user has reached their book limit
   */
  const hasReachedBookLimit = useCallback(
    (currentBookCount: number): boolean => {
      if (!isAuthenticated || !user) return true; // Unauthenticated users can't add books

      let maxBooks = 0;

      // If we have a subscription from the hook, use that as it's more up-to-date
      if (subscription) {
        maxBooks = SUBSCRIPTION_LIMITS[subscription.tier].maxBooks as number;
      }
      // Fallback to the user's subscription from the auth hook
      else if (user.subscription) {
        maxBooks = SUBSCRIPTION_LIMITS[user.subscription.tier]
          .maxBooks as number;
      }
      // Default to free tier if no subscription is found
      else {
        maxBooks = SUBSCRIPTION_LIMITS.free.maxBooks as number;
      }

      return currentBookCount >= maxBooks;
    },
    [isAuthenticated, user, subscription]
  );

  /**
   * Check if the user has AI credits available
   */
  const hasAiCredits = useCallback((): boolean => {
    if (!isAuthenticated || !user) return false;

    // If we have a subscription from the hook, use that as it's more up-to-date
    if (subscription) {
      return subscription.aiCreditsRemaining > 0;
    }

    // Fallback to the user's subscription from the auth hook
    if (user.subscription) {
      return user.subscription.aiCreditsRemaining > 0;
    }

    return false;
  }, [isAuthenticated, user, subscription]);

  /**
   * Get the subscription tier name
   */
  const getSubscriptionTier = useCallback((): "free" | "basic" | "premium" => {
    if (!isAuthenticated || !user) return "free";

    if (subscription) {
      return subscription.tier;
    }

    if (user.subscription) {
      return user.subscription.tier;
    }

    return "free";
  }, [isAuthenticated, user, subscription]);

  /**
   * Get the current number of AI credits remaining
   */
  const getAiCreditsRemaining = useCallback((): number => {
    if (!isAuthenticated || !user) return 0;

    if (subscription) {
      return subscription.aiCreditsRemaining;
    }

    if (user.subscription) {
      return user.subscription.aiCreditsRemaining;
    }

    return 0;
  }, [isAuthenticated, user, subscription]);

  return {
    canAccess,
    hasReachedBookLimit,
    hasAiCredits,
    isLoading: subscriptionLoading,
    getSubscriptionTier,
    getAiCreditsRemaining,
  };
}
