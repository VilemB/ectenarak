"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { SubscriptionFeature } from "@/types/user";
import { useSubscription } from "@/hooks/useSubscription";

// Define proper types for subscription
interface SubscriptionData {
  tier: "free" | "basic" | "premium";
  aiCreditsRemaining: number;
  aiCreditsTotal: number;
  periodEnd?: string;
  // Other optional properties without using any
  periodStart?: string;
  status?: string;
  cancelAtPeriodEnd?: boolean;
  price?: number;
}

// Feature validation state interface
interface FeatureValidationState {
  isValidating: boolean;
  validatedFeatures: Record<SubscriptionFeature, boolean>;
  validationCompleted: boolean;
  lastValidatedAt: number | null;
}

// Context interface
interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  loading: boolean;
  error: Error | null;
  refreshSubscriptionData: () => Promise<void>;
  // Add batch validation functionality
  featureValidation: FeatureValidationState;
  batchValidateFeatures: () => Promise<Record<SubscriptionFeature, boolean>>;
  canAccessFeature: (feature: SubscriptionFeature) => boolean;
}

// Default validation state
const defaultValidationState: FeatureValidationState = {
  isValidating: false,
  validatedFeatures: {
    maxBooks: false,
    aiCreditsPerMonth: false,
    exportToPdf: false,
    advancedNoteFormat: false,
    aiAuthorSummary: false,
    aiCustomization: false,
    detailedAuthorInfo: false,
    extendedAiSummary: false,
  },
  validationCompleted: false,
  lastValidatedAt: null,
};

// Create the context
const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { subscription, loading, error, refreshSubscription } =
    useSubscription();
  const [featureValidation, setFeatureValidation] =
    useState<FeatureValidationState>(defaultValidationState);

  // Function to batch validate all features at once
  const batchValidateFeatures = useCallback(async (): Promise<
    Record<SubscriptionFeature, boolean>
  > => {
    if (featureValidation.isValidating) {
      return featureValidation.validatedFeatures;
    }

    setFeatureValidation((prev) => ({
      ...prev,
      isValidating: true,
    }));

    try {
      // Simulate slight delay for loading animation
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Check subscription status
      const validatedFeatures: Record<SubscriptionFeature, boolean> = {
        ...defaultValidationState.validatedFeatures,
      };

      if (subscription) {
        // For simplicity, we're assuming if you have the tier, you have access
        const tier = subscription.tier;

        // Check each feature based on tier
        if (tier === "premium") {
          // Premium has access to everything
          Object.keys(validatedFeatures).forEach((feature) => {
            validatedFeatures[feature as SubscriptionFeature] = true;
          });
        } else if (tier === "basic") {
          // Basic tier has access to some features
          validatedFeatures.exportToPdf = true;
          validatedFeatures.advancedNoteFormat = true;
          validatedFeatures.aiAuthorSummary = true;
          validatedFeatures.aiCustomization = true;
        }

        // Free tier has no premium features (already defaulted to false)
      }

      setFeatureValidation({
        isValidating: false,
        validatedFeatures,
        validationCompleted: true,
        lastValidatedAt: Date.now(),
      });

      return validatedFeatures;
    } catch (error) {
      console.error("Error validating features:", error);
      setFeatureValidation((prev) => ({
        ...prev,
        isValidating: false,
      }));
      return featureValidation.validatedFeatures;
    }
  }, [
    subscription,
    featureValidation.isValidating,
    featureValidation.validatedFeatures,
  ]);

  // Function to check access to a specific feature
  const canAccessFeature = useCallback(
    (feature: SubscriptionFeature): boolean => {
      // If validation hasn't completed, assume no access
      if (!featureValidation.validationCompleted) {
        return false;
      }
      return featureValidation.validatedFeatures[feature];
    },
    [featureValidation.validationCompleted, featureValidation.validatedFeatures]
  );

  // Run initial validation when subscription loads
  useEffect(() => {
    if (!loading && subscription && !featureValidation.validationCompleted) {
      batchValidateFeatures();
    }
  }, [
    loading,
    subscription,
    featureValidation.validationCompleted,
    batchValidateFeatures,
  ]);

  // Refresh subscription data (pass through from useSubscription)
  const refreshSubscriptionData = useCallback(async () => {
    await refreshSubscription();
    // Reset validation status to force revalidation
    setFeatureValidation((prev) => ({
      ...prev,
      validationCompleted: false,
    }));
  }, [refreshSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        error,
        refreshSubscriptionData,
        featureValidation,
        batchValidateFeatures,
        canAccessFeature,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === null) {
    throw new Error(
      "useSubscriptionContext must be used within a SubscriptionProvider"
    );
  }
  return context;
}
