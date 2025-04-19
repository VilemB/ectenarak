"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles,
  BookText,
  BookOpen,
  Info,
  Calendar,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
          <p className="text-gray-300">Načítání informací o předplatném...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="text-white min-h-screen flex flex-col">
        <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 pointer-events-none z-[-1]"></div>
        <div className="fixed inset-0 bg-gradient-to-b from-transparent via-background/5 to-background/20 pointer-events-none z-[-1]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10 flex-grow">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12 md:space-y-16"
          >
            <motion.div
              variants={itemVariants}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                Správa předplatného
              </h1>
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6">
                {currentTier === "free"
                  ? "Odemkněte plný potenciál vaší čtenářské cesty s naším prémiovým předplatným."
                  : "Zde naleznete informace o vašem aktuálním plánu a kreditech."}
              </p>
            </motion.div>

            {user && subscription && currentTier !== "free" && (
              <motion.div variants={itemVariants} className="max-w-2xl mx-auto">
                <Card className="bg-card/60 backdrop-blur-sm border border-border/40 shadow-xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-semibold text-center text-foreground">
                      Váš Aktuální Plán
                    </CardTitle>
                    <CardDescription className="text-center text-muted-foreground pt-1">
                      Přehled vašeho předplatného a využití.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 px-6 pt-4 pb-6">
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center justify-between py-3 border-b border-border/30"
                    >
                      <span className="text-sm font-medium text-muted-foreground flex items-center">
                        <Info className="h-4 w-4 mr-2 text-blue-400" /> Typ
                        předplatného:
                      </span>
                      <span className="font-semibold text-lg capitalize bg-gradient-to-r from-blue-400 to-indigo-400 text-transparent bg-clip-text">
                        {currentTier}
                      </span>
                    </motion.div>

                    {subscription.nextRenewalDate && (
                      <motion.div
                        variants={itemVariants}
                        className="flex items-center justify-between py-3 border-b border-border/30"
                      >
                        <span className="text-sm font-medium text-muted-foreground flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-green-400" />
                          {subscription.cancelAtPeriodEnd
                            ? "Platnost do:"
                            : "Příští platba:"}
                        </span>
                        <span className="font-medium text-foreground">
                          {new Date(
                            subscription.nextRenewalDate
                          ).toLocaleDateString("cs-CZ", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </motion.div>
                    )}

                    <motion.div
                      variants={itemVariants}
                      className="py-3 space-y-2"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground flex items-center">
                          <Sparkles className="h-4 w-4 mr-2 text-amber-400" />{" "}
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
                            <p>Aktualizovat kredity</p>
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
                          Vaše předplatné je naplánováno ke zrušení. Kredity
                          můžete využívat do konce období.
                        </p>
                      )}
                    </motion.div>
                  </CardContent>
                  {!subscription.cancelAtPeriodEnd && (
                    <CardFooter className="bg-muted/20 px-6 py-4 border-t border-border/30">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-red-400 border-red-400/50 hover:bg-red-900/30 hover:text-red-300 hover:border-red-400/70 transition-colors duration-200"
                            disabled={isCancelling}
                          >
                            {isCancelling
                              ? "Zpracovávání..."
                              : "Zrušit Předplatné"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-destructive/50 sm:max-w-lg">
                          <AlertDialogHeader>
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                              <AlertDialogTitle className="text-destructive">
                                Potvrzení Zrušení Předplatného
                              </AlertDialogTitle>
                            </div>
                            <AlertDialogDescription className="pt-3">
                              Chystáte se zrušit své{" "}
                              <span className="font-semibold capitalize text-foreground">
                                {currentTier}
                              </span>{" "}
                              předplatné. Zůstane aktivní do{" "}
                              <span className="font-semibold text-foreground">
                                {subscription.nextRenewalDate
                                  ? new Date(
                                      subscription.nextRenewalDate
                                    ).toLocaleDateString("cs-CZ")
                                  : "konce období"}
                              </span>
                              . Poté bude váš účet převeden na tarif Free a
                              přijdete o zbývající AI kredity. Opravdu chcete
                              pokračovat?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel
                              disabled={isCancelling}
                              className="transition-colors"
                            >
                              Ponechat předplatné
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleCancelSubscription}
                              disabled={isCancelling}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                            >
                              {isCancelling ? (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />{" "}
                                  Rušení...
                                </>
                              ) : (
                                "Ano, zrušit předplatné"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  )}
                </Card>
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="pt-8">
              <div className="text-center mb-8 md:mb-12 max-w-3xl mx-auto">
                <motion.h2
                  className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-3 md:mb-4 text-foreground"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {currentTier !== "free"
                    ? "Dostupné Plány"
                    : "Vyberte si Plán"}
                </motion.h2>
                <motion.p
                  className="text-muted-foreground text-base md:text-lg lg:text-xl mb-6 md:mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {currentTier !== "free"
                    ? "Níže naleznete přehled všech dostupných plánů."
                    : "Vyberte si plán, který nejlépe vyhovuje vašim potřebám."}
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
                  description="Základní funkce pro přípravu čtenářských zápisků potřebných k maturitě"
                  price="0 Kč"
                  pricePeriod=""
                  icon={<BookText className="h-6 w-6 text-muted-foreground" />}
                  badge={{
                    text: "Zdarma",
                    color: "bg-[#2a3548] text-muted-foreground",
                  }}
                  isCurrentPlan={currentTier === "free"}
                  buttonText={null}
                  onSelect={() => {}}
                  isLoading={false}
                  isSelected={false}
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
                  disabled={true}
                />

                <SubscriptionCard
                  title="Basic"
                  description="Rozšířené funkce pro důkladnou přípravu k maturitě a zvládnutí povinné četby"
                  price={billingCycle === "yearly" ? "39" : "49"}
                  pricePeriod="/ měsíc"
                  monthlyPrice={49}
                  icon={<BookOpen className="h-6 w-6 text-[#3b82f6]" />}
                  badge={{
                    text: currentTier === "basic" ? "Váš Plán" : "Populární",
                    color:
                      currentTier === "basic"
                        ? "bg-blue-600 text-white"
                        : "bg-[#2a3548] text-[#3b82f6]",
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
                  animationDelay={0.2}
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
                    {
                      name: "Export poznámek do PDF",
                      included: true,
                    },
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

                <SubscriptionCard
                  title="Premium"
                  description="Kompletní sada nástrojů pro perfektní přípravu k maturitě z literatury a dokonalé zvládnutí povinné četby"
                  price={billingCycle === "yearly" ? "63" : "79"}
                  pricePeriod="/ měsíc"
                  monthlyPrice={79}
                  icon={<Sparkles className="h-6 w-6 text-[#3b82f6]" />}
                  badge={{
                    text: currentTier === "premium" ? "Váš Plán" : "Doporučeno",
                    color:
                      currentTier === "premium"
                        ? "bg-blue-600 text-white"
                        : "bg-[#3b82f6] text-white",
                  }}
                  isCurrentPlan={currentTier === "premium"}
                  buttonText={
                    currentTier === "premium" ? "Aktuální Plán" : "Vybrat Plán"
                  }
                  onSelect={() => handlePlanSelect("premium")}
                  isLoading={
                    isChangingPlan && selectedTierForAction === "premium"
                  }
                  isSelected={selectedTierForAction === "premium"}
                  animationDelay={0.3}
                  features={[
                    {
                      name: `Až ${SUBSCRIPTION_LIMITS.premium.maxBooks} knih v knihovně`,
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
    </TooltipProvider>
  );
}
