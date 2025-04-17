"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, BookText, BookOpen } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useSubscription } from "@/hooks/useSubscription";
import { SUBSCRIPTION_LIMITS } from "@/types/user";
import AiCreditsDisplay from "@/components/AiCreditsDisplay";
import SubscriptionCard from "@/components/SubscriptionCard";
import LoginForm from "@/components/LoginForm";
import SubscriptionFAQ from "@/components/SubscriptionFAQ";
import { toast } from "sonner";

export default function SubscriptionPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [selectedTierForAction, setSelectedTierForAction] = useState<
    "basic" | "premium" | null
  >(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  const { subscription, loading, refreshSubscription } = useSubscription();
  const { getSubscriptionTier } = useFeatureAccess();

  // Refs for polling timers
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stop polling function
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearTimeout(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    // Keep isChangingPlan true until success or timeout, then reset
    // Resetting is handled within the polling logic or error handler
  };

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

  // Polling function
  const pollForSubscriptionChange = async (
    expectedPriceId: string,
    maxAttempts = 10, // Approx 30 seconds
    interval = 3000 // 3 seconds
  ) => {
    console.log(`[Polling] Starting polling for price ID: ${expectedPriceId}`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`[Polling] Attempt ${attempt}/${maxAttempts}...`);
      try {
        // Fetch the latest subscription data
        const latestSub = await refreshSubscription();

        // Check if the fetched subscription has the expected price ID
        if (latestSub?.stripePriceId === expectedPriceId) {
          console.log(
            "[Polling] Match found! Waiting briefly before confirming..."
          );
          stopPolling(); // Stop polling immediately to prevent further checks

          // Wait for a short period (e.g., 1.5 seconds) AFTER match found
          await new Promise((resolve) => setTimeout(resolve, 1500));

          console.log("[Polling] Success! Subscription updated confirmed.");
          toast.success("Předplatné bylo úspěšně aktualizováno!");
          setIsChangingPlan(false); // Reset loading state on success
          setSelectedTierForAction(null);
          // Perform one final refresh *after* the delay to ensure UI gets latest state
          await refreshSubscription();
          return; // Exit polling on success
        }
      } catch (error) {
        console.error("[Polling] Error during refresh:", error);
        // Decide if you want to stop polling on fetch error, or continue?
        // For now, let's continue polling, but log the error.
      }

      // If not found and not the last attempt, wait for the next interval
      if (attempt < maxAttempts) {
        await new Promise((resolve) => {
          pollIntervalRef.current = setTimeout(resolve, interval);
        });
        // Check if polling was stopped externally (e.g., unmount) while waiting
        if (!pollIntervalRef.current) {
          console.log("[Polling] Polling stopped externally.");
          return;
        }
      }
    }

    // If loop finishes without success (timeout)
    console.warn(
      "[Polling] Timeout reached. Subscription update not confirmed."
    );
    toast.warning(
      "Aktualizace předplatného se stále zpracovává. Změna se projeví za chvíli. Můžete obnovit stránku."
    );
    stopPolling();
    setIsChangingPlan(false); // Reset loading state on timeout
    setSelectedTierForAction(null);
    await refreshSubscription(); // Attempt one final refresh
  };

  useEffect(() => {
    setIsChangingPlan(false);
    setSelectedTierForAction(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const intendedSubscription = sessionStorage.getItem(
      "intendedSubscription"
    ) as "basic" | "premium" | null;
    const yearlyBilling = sessionStorage.getItem("yearlyBilling");

    if (intendedSubscription) {
      setSelectedTierForAction(null);
      sessionStorage.removeItem("intendedSubscription");

      setTimeout(() => {
        setSelectedTierForAction(intendedSubscription);

        setTimeout(() => {
          setSelectedTierForAction(null);
        }, 800);
      }, 100);
    }

    if (yearlyBilling === "true") {
      setBillingCycle("yearly");
      sessionStorage.removeItem("yearlyBilling");
    }
  }, []);

  const currentTier = getSubscriptionTier();

  const getPriceIdForTier = (
    tier: "basic" | "premium",
    cycle: "monthly" | "yearly"
  ): string | null => {
    let priceId: string | undefined;
    if (tier === "basic") {
      priceId =
        cycle === "yearly"
          ? process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID
          : process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID;
    }
    if (tier === "premium") {
      priceId =
        cycle === "yearly"
          ? process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID
          : process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID;
    }
    return priceId || null;
  };

  const handleCheckout = async (priceId: string | null) => {
    if (!priceId || priceId.trim() === "" || priceId === "price_free") {
      console.error(
        "handleCheckout Error: Invalid Price ID provided:",
        priceId
      );
      toast.error("Nelze zpracovat platbu: Chybí nebo je neplatné ID ceny.");
      setIsChangingPlan(false);
      setSelectedTierForAction(null);
      return;
    }

    console.log(`Attempting checkout with Price ID: ${priceId}`);
    setIsChangingPlan(true);
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create checkout session");
      }
      const { url } = await response.json();
      window.location.href = url;
    } catch (error: unknown) {
      console.error("Checkout error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Nepodařilo se vytvořit platební relaci.";
      toast.error(message);
      setIsChangingPlan(false);
      setSelectedTierForAction(null);
    }
  };

  const handleChangeSubscription = async (targetPriceId: string) => {
    setIsChangingPlan(true);
    // No need to set selectedTierForAction here, handlePlanSelect does it
    try {
      // Stop any previous polling just in case
      stopPolling();

      const response = await fetch("/api/update-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: targetPriceId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Nepodařilo se aktualizovat předplatné");
      }

      // Instead of simple success toast and setTimeout, start polling
      toast.info("Požadavek odeslán. Ověřuji stav aktualizace předplatného...");
      // Don't reset isChangingPlan or selectedTierForAction here, polling function will do it
      pollForSubscriptionChange(targetPriceId);

      // Remove the old setTimeout
      // setTimeout(() => refreshSubscription(), 2000);
    } catch (error: unknown) {
      console.error("Error changing subscription:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Nepodařilo se změnit předplatné.";
      toast.error(message);
      stopPolling(); // Stop polling on error
      setIsChangingPlan(false); // Reset loading state on error
      setSelectedTierForAction(null);
    }
    // Remove the finally block as state is handled by polling/error paths
    // finally {
    //   setIsChangingPlan(false);
    //   setSelectedTierForAction(null);
    // }
  };

  const handlePlanSelect = (selectedTier: "basic" | "premium") => {
    // Initial checks (unchanged)
    if (!isAuthenticated || isChangingPlan) {
      console.log(
        "[handlePlanSelect] Aborted: Not authenticated or already changing plan."
      );
      return;
    }

    const targetPriceId = getPriceIdForTier(selectedTier, billingCycle);
    console.log(
      `[handlePlanSelect] Target Price ID for ${selectedTier}/${billingCycle}:`,
      targetPriceId
    );

    if (!targetPriceId) {
      toast.error("Konfigurace ceny pro tento plán nebyla nalezena.");
      return;
    }

    setSelectedTierForAction(selectedTier); // Set visual feedback state

    // --- Decision Logic ---
    const currentTierValue = getSubscriptionTier();
    const currentStripeSubId =
      subscription && "stripeSubscriptionId" in subscription
        ? subscription.stripeSubscriptionId
        : null;

    // Log the decision factors clearly
    console.log(`[handlePlanSelect] Decision Factors:`);
    console.log(`  - Current App Tier: ${currentTierValue}`);
    console.log(`  - Subscription Data Loaded:`, subscription);
    console.log(`  - Found Stripe Sub ID: ${currentStripeSubId}`);

    // Determine if it should be a new checkout or an update
    const isNewCheckout = currentTierValue === "free" || !currentStripeSubId;

    if (isNewCheckout) {
      console.log("[handlePlanSelect] Decision: Starting NEW checkout.");
      // Ensure priceId is valid before proceeding (double check)
      if (!targetPriceId) {
        toast.error("Interní chyba: Chybí Price ID pro checkout.");
        setSelectedTierForAction(null);
        return;
      }
      handleCheckout(targetPriceId);
    } else {
      console.log(
        "[handlePlanSelect] Decision: Updating EXISTING subscription."
      );
      // Ensure priceId is valid before proceeding (double check)
      if (!targetPriceId) {
        toast.error("Interní chyba: Chybí Price ID pro update.");
        setSelectedTierForAction(null);
        return;
      }
      handleChangeSubscription(targetPriceId);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  if (isLoading) {
    return (
      <div className="text-white min-h-screen flex flex-col items-center justify-center">
        <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 pointer-events-none z-[-1]"></div>
        <div className="fixed inset-0 bg-gradient-to-b from-transparent via-background/5 to-background/20 pointer-events-none z-[-1]"></div>
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-blue-500 animate-spin"></div>
          <p className="text-gray-300">Načítání...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-white min-h-screen flex flex-col">
        <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 pointer-events-none z-[-1]"></div>
        <div className="fixed inset-0 bg-gradient-to-b from-transparent via-background/5 to-background/20 pointer-events-none z-[-1]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10 flex-grow">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
              Správa předplatného
            </h1>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6">
              Pro správu předplatného se prosím přihlaste
            </p>
            <div className="max-w-md mx-auto">
              <LoginForm />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!isLoading && isAuthenticated && loading) {
    return (
      <div className="text-white min-h-screen flex flex-col items-center justify-center">
        <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 pointer-events-none z-[-1]"></div>
        <div className="fixed inset-0 bg-gradient-to-b from-transparent via-background/5 to-background/20 pointer-events-none z-[-1]"></div>
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-blue-500 animate-spin"></div>
          <p className="text-gray-300">Načítání předplatného...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white min-h-screen flex flex-col">
      <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 pointer-events-none z-[-1]"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-background/5 to-background/20 pointer-events-none z-[-1]"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10 flex-grow">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12 md:space-y-20"
        >
          <motion.div
            variants={itemVariants}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
              Vyberte si ideální plán
            </h1>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6">
              Odemkněte plný potenciál vaší čtenářské cesty s naším prémiovým
              předplatným.
            </p>

            {user && subscription && (
              <motion.div
                variants={itemVariants}
                className="mt-8 md:mt-10 bg-[#1a2436] border border-[#2a3548] rounded-xl p-5 md:p-6 max-w-lg mx-auto shadow-lg"
              >
                <h2 className="text-xl font-bold mb-3">
                  Vaše předplatné:{" "}
                  <span className="text-blue-400">
                    {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                  </span>
                </h2>

                <div className="bg-[#0f1729] rounded-lg p-4 mb-4 shadow-inner">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">
                      AI Kredity tento měsíc
                    </span>
                    <span className="text-xs text-gray-400">
                      Obnovení:{" "}
                      {subscription?.nextRenewalDate
                        ? new Date(
                            subscription.nextRenewalDate
                          ).toLocaleDateString("cs-CZ")
                        : new Date(
                            new Date().setMonth(new Date().getMonth() + 1)
                          ).toLocaleDateString("cs-CZ")}
                    </span>
                  </div>

                  <AiCreditsDisplay
                    aiCreditsRemaining={subscription.aiCreditsRemaining}
                    aiCreditsTotal={subscription.aiCreditsTotal}
                    className="mt-1"
                  />
                </div>

                <div className="text-sm text-center text-gray-400 mt-3">
                  Změňte své předplatné níže pro přístup k více funkcím nebo
                  kreditům
                </div>
              </motion.div>
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="text-center mb-8 md:mb-12 max-w-3xl mx-auto">
              <motion.h2
                className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-3 md:mb-4 text-foreground"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {user ? "Změnit předplatné" : "Vyberte si plán"}
              </motion.h2>
              <motion.p
                className="text-muted-foreground text-base md:text-lg lg:text-xl mb-6 md:mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Vyberte si plán, který nejlépe vyhovuje vašim potřebám
              </motion.p>

              <div className="flex justify-center mb-8 md:mb-12">
                <Tabs
                  defaultValue="monthly"
                  value={billingCycle}
                  onValueChange={(value) =>
                    setBillingCycle(value as "monthly" | "yearly")
                  }
                  className="w-full max-w-md"
                >
                  <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted/30 backdrop-blur-sm border border-white/5 shadow-md">
                    <TabsTrigger
                      value="monthly"
                      className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
                    >
                      Měsíčně
                    </TabsTrigger>
                    <TabsTrigger
                      value="yearly"
                      className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
                    >
                      Ročně{" "}
                      <motion.span
                        className="inline-flex items-center ml-1"
                        initial={{ scale: 1 }}
                        whileHover={{ scale: 1.1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        <span className="text-xs font-medium bg-gradient-to-r from-emerald-400 to-emerald-500 text-transparent bg-clip-text">
                          -20%
                        </span>
                        <Sparkles className="h-3 w-3 ml-1 text-emerald-400" />
                      </motion.span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto px-2">
              <SubscriptionCard
                title="Základní"
                subtitle="Pro běžnou četbu"
                description="Základní funkce pro přípravu čtenářských zápisků potřebných k maturitě"
                price="0 Kč"
                pricePeriod=""
                priceId="price_free"
                icon={<BookText className="h-6 w-6 text-muted-foreground" />}
                badge={{
                  text: "Zdarma",
                  color: "bg-[#2a3548] text-muted-foreground",
                }}
                isCurrentPlan={currentTier === "free"}
                buttonText={
                  currentTier === "free" ? "Aktuální plán" : "Vybrat plán"
                }
                onSelect={() => {
                  /* No action needed? Or maybe cancellation logic */
                }}
                isLoading={false}
                isSelected={false}
                accentColor="#6b7280"
                animationDelay={0.1}
                features={[
                  {
                    name: `Až ${SUBSCRIPTION_LIMITS.free.maxBooks} knih v knihovně`,
                    included: true,
                  },
                  {
                    name: "Manuální poznámky",
                    included: true,
                  },
                  {
                    name: `${SUBSCRIPTION_LIMITS.free.aiCreditsPerMonth} AI kredity`,
                    description: "měsíčně",
                    included: true,
                  },
                  {
                    name: "Základní funkce",
                    description: "pro začátek",
                    included: true,
                  },
                ]}
                disabled={currentTier === "free" || loading}
              />

              <SubscriptionCard
                title="Basic"
                subtitle="Pro ambiciózní studenty"
                description="Rozšířené funkce pro důkladnou přípravu k maturitě a zvládnutí povinné četby"
                price={billingCycle === "yearly" ? "39" : "49"}
                pricePeriod="/ měsíc"
                priceId={getPriceIdForTier("basic", billingCycle) || ""}
                monthlyPrice={49}
                isYearly={billingCycle === "yearly"}
                icon={<BookOpen className="h-6 w-6 text-[#3b82f6]" />}
                badge={{
                  text: "Populární",
                  color: "bg-[#2a3548] text-[#3b82f6]",
                }}
                isCurrentPlan={currentTier === "basic"}
                buttonText={
                  currentTier === "basic" ? "Aktuální plán" : "Vybrat plán"
                }
                onSelect={() => handlePlanSelect("basic")}
                isLoading={isChangingPlan && selectedTierForAction === "basic"}
                isSelected={selectedTierForAction === "basic"}
                accentColor="#3b82f6"
                animationDelay={0.2}
                features={[
                  {
                    name: "Až 100 knih v knihovně",
                    included: true,
                  },
                  {
                    name: "50 AI kreditů",
                    description: "měsíčně",
                    included: true,
                  },
                  {
                    name: "Export poznámek do PDF",
                    included: true,
                  },
                  {
                    name: "Všechny funkce ze Základního plánu",
                    included: true,
                  },
                ]}
                disabled={currentTier === "basic" || loading || isChangingPlan}
              />

              <SubscriptionCard
                title="Premium"
                subtitle="Pro budoucí maturanty"
                description="Kompletní sada nástrojů pro perfektní přípravu k maturitě z literatury a dokonalé zvládnutí povinné četby"
                price={billingCycle === "yearly" ? "63" : "79"}
                pricePeriod="/ měsíc"
                priceId={getPriceIdForTier("premium", billingCycle) || ""}
                monthlyPrice={79}
                isYearly={billingCycle === "yearly"}
                icon={<Sparkles className="h-6 w-6 text-[#3b82f6]" />}
                badge={{
                  text: "Doporučeno",
                  color: "bg-[#3b82f6] text-white",
                }}
                isCurrentPlan={currentTier === "premium"}
                buttonText={
                  currentTier === "premium" ? "Aktuální plán" : "Vybrat plán"
                }
                onSelect={() => handlePlanSelect("premium")}
                isLoading={
                  isChangingPlan && selectedTierForAction === "premium"
                }
                isSelected={selectedTierForAction === "premium"}
                accentColor="#3b82f6"
                animationDelay={0.3}
                features={[
                  {
                    name: "Neomezený počet knih v knihovně",
                    included: true,
                  },
                  {
                    name: "100 AI kreditů",
                    description: "měsíčně",
                    included: true,
                  },
                  {
                    name: "Přizpůsobění AI shrnutí",
                    description: "Zaměření, detailnost, styl",
                    included: true,
                  },
                  {
                    name: "Prioritní podpora",
                    included: true,
                  },
                  {
                    name: "Všechny funkce z Basic plánu",
                    included: true,
                  },
                ]}
                disabled={
                  currentTier === "premium" || loading || isChangingPlan
                }
              />
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="max-w-3xl mx-auto mt-16 md:mt-20"
          >
            <SubscriptionFAQ />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
