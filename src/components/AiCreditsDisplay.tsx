import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";

interface AiCreditsDisplayProps {
  aiCreditsRemaining: number;
  aiCreditsTotal: number;
  showLowCreditsWarning?: boolean;
  className?: string;
}

async function fetchCredits() {
  const response = await fetch("/api/subscription");
  if (!response.ok) {
    throw new Error("Failed to fetch credits");
  }
  const data = await response.json();
  return data.subscription;
}

export default function AiCreditsDisplay({
  aiCreditsRemaining: initialCreditsRemaining,
  aiCreditsTotal: initialCreditsTotal,
  showLowCreditsWarning = true,
  className = "",
}: AiCreditsDisplayProps) {
  const { user } = useAuth();
  const { subscription } = useSubscriptionContext();
  const queryClient = useQueryClient();

  // Use React Query to manage the credits state
  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ["credits"],
    queryFn: fetchCredits,
    initialData: subscription ||
      user?.subscription || {
        aiCreditsRemaining: initialCreditsRemaining,
        aiCreditsTotal: initialCreditsTotal,
      },
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to enable immediate updates
    gcTime: 0, // Don't cache the data (gcTime is the new name for cacheTime)
  });

  // Update query data when subscription context changes
  useEffect(() => {
    if (subscription) {
      queryClient.setQueryData(["credits"], subscription);
    }
  }, [subscription, queryClient]);

  // Use the most up-to-date values from context if available
  const currentCredits = {
    aiCreditsRemaining:
      subscription?.aiCreditsRemaining ?? subscriptionData.aiCreditsRemaining,
    aiCreditsTotal:
      subscription?.aiCreditsTotal ?? subscriptionData.aiCreditsTotal,
  };

  // Force immediate UI update when credits change
  useEffect(() => {
    const prevCredits = subscription?.aiCreditsRemaining;
    const newCredits = currentCredits.aiCreditsRemaining;

    if (prevCredits !== newCredits) {
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    }
  }, [
    currentCredits.aiCreditsRemaining,
    subscription?.aiCreditsRemaining,
    queryClient,
  ]);

  // Calculate if credits are low (25% or less remaining)
  const isLowCredits =
    currentCredits.aiCreditsRemaining <=
    Math.ceil(currentCredits.aiCreditsTotal * 0.25);
  // Check if credits are completely depleted
  const isZeroCredits = currentCredits.aiCreditsRemaining === 0;

  // Calculate percentage for progress bar
  const percentRemaining =
    (currentCredits.aiCreditsRemaining / currentCredits.aiCreditsTotal) * 100;

  return (
    <div className={`ai-credits-display ${className}`}>
      <div className="flex items-center">
        <div className="flex-1">
          <div className="h-2.5 bg-muted rounded-full overflow-hidden relative">
            <motion.div
              className={`h-full transition-all duration-700 ease-out ${
                isZeroCredits
                  ? "bg-red-600/70"
                  : isLowCredits
                    ? "bg-gradient-to-r from-amber-600/70 to-amber-500"
                    : "bg-gradient-to-r from-amber-600/70 to-amber-400"
              }`}
              initial={{ width: "0%" }}
              animate={{ width: `${percentRemaining}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
            {isLoading && (
              <motion.div
                className="absolute inset-0 bg-white/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
        </div>
        <div className="ml-4 flex items-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentCredits.aiCreditsRemaining}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className={`font-medium text-sm ${
                isZeroCredits
                  ? "text-red-400"
                  : isLowCredits
                    ? "text-amber-400"
                    : "text-amber-500"
              }`}
            >
              {currentCredits.aiCreditsRemaining}
            </motion.span>
          </AnimatePresence>
          <span className="text-muted-foreground mx-1 text-sm">/</span>
          <span className="text-muted-foreground text-sm">
            {currentCredits.aiCreditsTotal}
          </span>
          {isLoading && (
            <motion.div
              className="ml-2"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <svg
                className="w-3.5 h-3.5 text-amber-500"
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </motion.div>
          )}
        </div>
      </div>

      {showLowCreditsWarning && isLowCredits && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-amber-400/80 mt-2 flex items-center"
        >
          <span className="inline-block mr-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-3.5 h-3.5 ${isZeroCredits ? "text-red-400" : ""}`}
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          {isZeroCredits
            ? "Vyčerpali jste všechny AI kredity. Kredit se využívá při generování AI obsahu."
            : "Docházejí vám kredity. Kredit se využívá při generování AI obsahu."}
        </motion.p>
      )}
    </div>
  );
}
