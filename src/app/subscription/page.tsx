"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { RefreshCw, Trash2, X } from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useSubscription } from "@/hooks/useSubscription";
import { SUBSCRIPTION_LIMITS } from "@/types/user";
import AiCreditsDisplay from "@/components/AiCreditsDisplay";
import SubscriptionCard from "@/components/SubscriptionCard";
import LoginForm from "@/components/LoginForm";
import SubscriptionFAQ from "@/components/SubscriptionFAQ";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function SubscriptionPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [selectedTierForAction, setSelectedTierForAction] = useState<
    "basic" | "premium" | null
  >(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  const { subscription, loading, refreshSubscription } = useSubscription();
  const { getSubscriptionTier } = useFeatureAccess();

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

  const handleCheckout = async (
    priceId: string | null,
    tierForCheckout: "basic" | "premium"
  ) => {
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

    console.log(
      `Attempting checkout with Price ID: ${priceId} for tier: ${tierForCheckout}`
    );
    setIsChangingPlan(true);
    try {
      sessionStorage.setItem("intendedSubscription", tierForCheckout);
      sessionStorage.setItem(
        "yearlyBilling",
        billingCycle === "yearly" ? "true" : "false"
      );

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
      sessionStorage.removeItem("intendedSubscription");
      sessionStorage.removeItem("yearlyBilling");
    }
  };

  const handlePlanSelect = (selectedTier: "basic" | "premium") => {
    if (!isAuthenticated || isChangingPlan) {
      console.log(
        "[handlePlanSelect] Aborted: Not authenticated or action in progress."
      );
      return;
    }

    setSelectedTierForAction(selectedTier);

    const targetPriceId = getPriceIdForTier(selectedTier, billingCycle);
    if (!targetPriceId) {
      toast.error("Konfigurace ceny pro tento plán nebyla nalezena.");
      setSelectedTierForAction(null);
      return;
    }

    const currentTierValue = getSubscriptionTier();

    const isNewCheckout = currentTierValue === "free";
    const isUpgrade =
      currentTierValue === "basic" && selectedTier === "premium";

    if (isNewCheckout || isUpgrade) {
      console.log(
        `[handlePlanSelect] Starting checkout for ${selectedTier}. Current: ${currentTierValue}`
      );
      handleCheckout(targetPriceId, selectedTier);
    } else {
      console.log(
        `[handlePlanSelect] User already on paid plan (${currentTierValue}). Direct change via UI currently disabled for this scenario.`
      );
      toast.info(
        "Pro změnu nebo zrušení stávajícího předplatného použijte sekci 'Správa předplatného'."
      );
      setSelectedTierForAction(null);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch("/api/subscription", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || "Nepodařilo se naplánovat zrušení předplatného."
        );
      }

      await refreshSubscription();

      toast.success(
        "Vaše předplatné bude zrušeno na konci fakturačního období."
      );
    } catch (error: unknown) {
      console.error("Cancellation error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Při rušení předplatného došlo k chybě.";
      toast.error(message);
    } finally {
      setIsCancelling(false);
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
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
            variants={sectionVariants}
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
          <p className="text-gray-300">Načítání informací o předplatném...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="text-white min-h-screen flex flex-col relative">
        <div className="fixed inset-0 top-[15%] sm:top-[20%] bg-[url('/grid-pattern.svg')] bg-center opacity-5 pointer-events-none z-[-1]"></div>
        <div className="fixed inset-0 top-[15%] sm:top-[20%] bg-gradient-to-b from-transparent via-background/5 to-background/20 pointer-events-none z-[-1]"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20 flex-grow w-full">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-3xl mx-auto mb-16 md:mb-24"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-5 md:mb-7 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
              Správa předplatného
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {currentTier === "free"
                ? "Odemkněte plný potenciál čtení. Vyberte si plán, který vám nejlépe vyhovuje."
                : "Zde naleznete přehled vašeho plánu, využití kreditů a možnosti správy."}
            </p>
          </motion.div>

          <div className="space-y-12 md:space-y-16">
            <motion.section
              aria-labelledby="current-status-heading"
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="w-full"
            >
              {user && subscription && currentTier !== "free" ? (
                <div className="bg-muted/30 border border-border/20 rounded-lg p-6 md:p-8 space-y-6 shadow-sm">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block mb-1">
                          Typ předplatného:
                        </span>
                        <span className="font-medium text-foreground capitalize text-base">
                          {currentTier}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-1">
                          {subscription.cancelAtPeriodEnd
                            ? "Platnost do:"
                            : "Příští platba:"}
                        </span>
                        <span className="font-medium text-foreground text-base">
                          {subscription.nextRenewalDate ? (
                            new Date(
                              subscription.nextRenewalDate
                            ).toLocaleDateString("cs-CZ", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          ) : (
                            <span className="italic text-muted-foreground/80">
                              Není k dispozici
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="pt-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          AI Kredity:
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={refreshSubscription}
                              disabled={loading}
                            >
                              <RefreshCw
                                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Aktualizovat</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <AiCreditsDisplay
                        aiCreditsRemaining={
                          subscription.aiCreditsRemaining ?? 0
                        }
                        aiCreditsTotal={
                          subscription.aiCreditsTotal ??
                          SUBSCRIPTION_LIMITS[currentTier]?.aiCreditsPerMonth ??
                          0
                        }
                        showLowCreditsWarning={true}
                      />
                      {subscription.cancelAtPeriodEnd && (
                        <p className="text-xs text-amber-400 italic pt-3 text-center">
                          Vaše předplatné je naplánováno ke zrušení.
                        </p>
                      )}
                    </div>
                  </motion.div>

                  {!subscription.cancelAtPeriodEnd && (
                    <div className="pt-6 border-t border-border/20 flex items-center justify-start">
                      <motion.div
                        layout
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                        className="flex items-center gap-x-2 p-1 bg-background rounded-lg border border-border"
                        style={{ overflow: "hidden" }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "transition-all duration-200 group flex items-center justify-center",
                            !isConfirmingCancel &&
                              "bg-transparent text-destructive hover:bg-destructive/10 hover:scale-[1.03] active:scale-[0.98]",
                            isConfirmingCancel &&
                              "border-0 text-muted-foreground"
                          )}
                          onClick={() => setIsConfirmingCancel(true)}
                          disabled={isCancelling || isConfirmingCancel}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />{" "}
                          <span>Zrušit Předplatné</span>
                        </Button>

                        <AnimatePresence>
                          {isConfirmingCancel && (
                            <motion.div
                              className="flex items-center gap-x-1"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleCancelSubscription}
                                disabled={isCancelling}
                                className={cn(
                                  "w-full sm:w-auto whitespace-nowrap",
                                  "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-[1.03] active:scale-[0.98]",
                                  "disabled:opacity-100 disabled:pointer-events-auto"
                                )}
                              >
                                {isCancelling ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />{" "}
                                    Rušení...
                                  </>
                                ) : (
                                  "Potvrdit zrušení"
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsConfirmingCancel(false)}
                                disabled={isCancelling}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  )}
                </div>
              ) : (
                <motion.div
                  variants={sectionVariants}
                  className="text-center max-w-2xl mx-auto"
                >
                  <motion.p
                    className="text-muted-foreground text-lg leading-relaxed mb-8 mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    Přejděte na Basic nebo Premium a získejte více AI kreditů a
                    pokročilé funkce pro snadnější přípravu k maturitě.
                  </motion.p>
                </motion.div>
              )}
            </motion.section>

            <motion.section
              aria-labelledby="available-plans-heading"
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="w-full space-y-10 md:space-y-12"
            >
              <div className="text-center max-w-2xl mx-auto">
                <h2
                  id="available-plans-heading"
                  className="text-2xl font-semibold tracking-tight text-foreground mb-3"
                >
                  Vyberte si plán
                </h2>
                <p className="text-muted-foreground text-lg md:text-xl">
                  Vyberte si měsíční nebo roční fakturaci (s 20% slevou).
                </p>
              </div>

              <motion.div
                className="flex justify-center mt-8 mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center rounded-full bg-muted/50 border border-border/30 p-1 shadow-sm">
                  <Button
                    onClick={() => setBillingCycle("monthly")}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "rounded-full px-6 py-1.5 transition-colors duration-200",
                      billingCycle === "monthly"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Měsíčně
                  </Button>
                  <Button
                    onClick={() => setBillingCycle("yearly")}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "rounded-full px-6 py-1.5 transition-colors duration-200",
                      billingCycle === "yearly"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Ročně
                    <span
                      className={cn(
                        "ml-2 inline-block rounded-md px-1.5 py-0.5 text-xs font-medium",
                        billingCycle === "yearly"
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      (Ušetřete 20%)
                    </span>
                  </Button>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <SubscriptionCard
                    title="Basic"
                    description="Rozšířené funkce pro důkladnou přípravu k maturitě."
                    price={billingCycle === "yearly" ? "39" : "49"}
                    pricePeriod="/ měsíc"
                    monthlyPrice={49}
                    badge={{
                      text: currentTier === "basic" ? "Váš Plán" : "Populární",
                      color:
                        currentTier === "basic"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                    }}
                    isCurrentPlan={currentTier === "basic"}
                    buttonText={
                      currentTier === "basic"
                        ? "Aktuální Plán"
                        : currentTier === "premium"
                          ? null
                          : "Vybrat Plán"
                    }
                    onSelect={() => handlePlanSelect("basic")}
                    isLoading={
                      isChangingPlan && selectedTierForAction === "basic"
                    }
                    isSelected={selectedTierForAction === "basic"}
                    animationDelay={0.1}
                    features={[
                      {
                        name: `Až ${SUBSCRIPTION_LIMITS.basic.maxBooks} knih v knihovně`,
                        included: true,
                      },
                      {
                        name: `${SUBSCRIPTION_LIMITS.basic.aiCreditsPerMonth} AI kreditů`,
                        description: "měsíčně",
                        included: true,
                      },
                      { name: "Export poznámek do PDF", included: true },
                      {
                        name: "Všechny funkce ze Základního plánu",
                        included: true,
                      },
                    ]}
                    disabled={
                      currentTier === "basic" ||
                      currentTier === "premium" ||
                      loading ||
                      isChangingPlan
                    }
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <SubscriptionCard
                    title="Premium"
                    description="Kompletní sada nástrojů pro perfektní přípravu."
                    price={billingCycle === "yearly" ? "63" : "79"}
                    pricePeriod="/ měsíc"
                    monthlyPrice={79}
                    isRecommended={true}
                    badge={{
                      text:
                        currentTier === "premium" ? "Váš Plán" : "Doporučeno",
                      color:
                        currentTier === "premium"
                          ? "bg-primary text-primary-foreground"
                          : "bg-amber-600 text-white",
                    }}
                    isCurrentPlan={currentTier === "premium"}
                    buttonText={
                      currentTier === "premium"
                        ? "Aktuální Plán"
                        : "Vybrat Plán"
                    }
                    onSelect={() => handlePlanSelect("premium")}
                    isLoading={
                      isChangingPlan && selectedTierForAction === "premium"
                    }
                    isSelected={selectedTierForAction === "premium"}
                    animationDelay={0.2}
                    features={[
                      {
                        name: `Neomezený počet knih v knihovně`,
                        included: true,
                      },
                      {
                        name: `${SUBSCRIPTION_LIMITS.premium.aiCreditsPerMonth} AI kreditů`,
                        description: "měsíčně",
                        included: true,
                      },
                      {
                        name: "Přizpůsobení AI shrnutí",
                        description: "Zaměření, detailnost, styl",
                        included: true,
                      },
                      { name: "Prioritní podpora", included: true },
                      { name: "Všechny funkce z Basic plánu", included: true },
                    ]}
                    disabled={
                      currentTier === "premium" || loading || isChangingPlan
                    }
                  />
                </motion.div>
              </div>
            </motion.section>

            <motion.section
              aria-labelledby="faq-heading"
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="w-full pt-10 border-t border-border/20"
            >
              <SubscriptionFAQ />
            </motion.section>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
