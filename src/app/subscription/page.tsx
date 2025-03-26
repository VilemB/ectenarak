"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Check, BookText, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useSubscription } from "@/hooks/useSubscription";
import { SUBSCRIPTION_LIMITS } from "@/types/user";
import AiCreditsDisplay from "@/components/AiCreditsDisplay";

export default function SubscriptionPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [selectedTier, setSelectedTier] = useState<
    "free" | "basic" | "premium" | null
  >(null);

  const { subscription, loading, updateSubscription } = useSubscription();
  const { getSubscriptionTier } = useFeatureAccess();

  const currentTier = getSubscriptionTier();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/subscription");
    }
  }, [isLoading, isAuthenticated, router]);

  // Animation variants
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

  const handleChangeTier = async (tier: "free" | "basic" | "premium") => {
    try {
      if (tier === currentTier) {
        // Already on this tier
        return;
      }

      // Set selected tier for UI feedback
      setSelectedTier(tier);

      // Update the subscription
      await updateSubscription(tier, billingCycle === "yearly");

      // Show success message
      alert(`Předplatné bylo úspěšně změněno na ${tier}`);
    } catch (error) {
      console.error("Error updating subscription:", error);
      alert("Nastala chyba při aktualizaci předplatného");
    } finally {
      setSelectedTier(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-blue-500 animate-spin mb-4"></div>
        <p className="text-gray-300 ml-3">Načítání předplatného...</p>
      </div>
    );
  }

  // If we get here, the user should be authenticated

  return (
    <div className="text-white min-h-screen flex flex-col">
      {/* Subtle background pattern - fixed z-index issue */}
      <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 pointer-events-none z-[-1]"></div>

      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-background/5 to-background/20 pointer-events-none z-[-1]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10 flex-grow">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12 md:space-y-20"
        >
          {/* Header */}
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

            {/* Current subscription info and AI credits visualization */}
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
                      {new Date(
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

          {/* Pricing Section */}
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

              {/* Simple Pricing Toggle */}
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
                      <span className="ml-1 text-xs font-normal text-emerald-400">
                        Ušetříte 20%
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Subscription tiers - improved alignment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto px-2">
              {/* Free tier */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-[#1a2436] border border-[#2a3548] rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 relative flex flex-col h-full"
              >
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-[#2a3548] text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Zdarma
                  </div>
                </div>
                <div className="p-5 sm:p-6 flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 mr-3 flex items-center justify-center">
                      <BookText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold">Základní</h3>
                  </div>
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-bold">
                      0 Kč
                    </span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      navždy
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5 sm:mb-6">
                    Základní funkce pro správu zápisků
                  </p>

                  <Button
                    className={`w-full mb-6 sm:mb-8 py-5 ${
                      currentTier === "free"
                        ? "bg-muted/20 text-muted-foreground"
                        : "bg-transparent border border-[#2a3548] hover:bg-[#2a3548]/20 text-foreground"
                    } rounded-full shadow-sm hover:shadow-md transition-all duration-300`}
                    variant="outline"
                    onClick={() => handleChangeTier("free")}
                    disabled={
                      currentTier === "free" || loading || selectedTier !== null
                    }
                  >
                    {selectedTier === "free" ? (
                      <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto"></div>
                    ) : currentTier === "free" ? (
                      <span className="flex items-center justify-center font-medium">
                        Aktivní plán <Check className="ml-2 h-4 w-4" />
                      </span>
                    ) : (
                      <span className="flex items-center justify-center font-medium">
                        Vybrat plán
                      </span>
                    )}
                  </Button>

                  <div className="text-xs uppercase tracking-wider mb-4 font-medium text-[#6b7280] border-t border-[#2a3548] pt-4">
                    ZAHRNUJE
                  </div>
                  <ul className="space-y-2.5 sm:space-y-3">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-muted-foreground mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        Až {SUBSCRIPTION_LIMITS.free.maxBooks} knih v knihovně
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-muted-foreground mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        Manuální poznámky ke knihám
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-muted-foreground mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        <span className="font-medium">
                          {SUBSCRIPTION_LIMITS.free.aiCreditsPerMonth} AI
                          kredity
                        </span>{" "}
                        měsíčně
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-muted-foreground mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        Jednoduchý formát poznámek
                      </span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Basic tier */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                whileHover={{ y: -5 }}
                className="bg-[#1a2436] border border-[#2a3548] rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 relative flex flex-col h-full"
              >
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-[#2a3548] text-[#3b82f6] text-xs font-medium px-3 py-1 rounded-full">
                    Populární
                  </div>
                </div>
                <div className="p-5 sm:p-6 flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 mr-3 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-[#3b82f6]" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold">Basic</h3>
                  </div>
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-bold">
                      {billingCycle === "yearly" ? "39 Kč" : "49 Kč"}
                    </span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      / měsíc
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5 sm:mb-6">
                    Rozšířené funkce pro efektivnější práci
                  </p>

                  <Button
                    className={`w-full mb-6 sm:mb-8 py-5 ${
                      currentTier === "basic"
                        ? "bg-blue-600/10 text-blue-500"
                        : "bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white"
                    } rounded-full shadow-lg hover:shadow-xl transition-all duration-300`}
                    variant={currentTier === "basic" ? "outline" : "default"}
                    onClick={() => handleChangeTier("basic")}
                    disabled={
                      currentTier === "basic" ||
                      loading ||
                      selectedTier !== null
                    }
                  >
                    {selectedTier === "basic" ? (
                      <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin mx-auto"></div>
                    ) : currentTier === "basic" ? (
                      <span className="flex items-center justify-center font-medium">
                        Aktivní plán <Check className="ml-2 h-4 w-4" />
                      </span>
                    ) : (
                      <span className="flex items-center justify-center font-medium">
                        Vybrat plán
                      </span>
                    )}
                  </Button>

                  <div className="text-xs uppercase tracking-wider mb-4 font-medium text-[#3b82f6] border-t border-[#2a3548] pt-4">
                    ZAHRNUJE
                  </div>
                  <ul className="space-y-2.5 sm:space-y-3">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        Až {SUBSCRIPTION_LIMITS.basic.maxBooks} knih v knihovně
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        <span className="font-medium">
                          {SUBSCRIPTION_LIMITS.basic.aiCreditsPerMonth} AI
                          kreditů
                        </span>{" "}
                        měsíčně
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        <span className="font-medium">AI shrnutí autorů</span> a
                        jejich děl
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        <span className="font-medium">
                          Export poznámek do PDF
                        </span>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">Pokročilý formát poznámek</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Premium tier */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                whileHover={{ y: -5 }}
                className="bg-[#1a2436] border-2 border-[#3b82f6] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 relative flex flex-col h-full md:scale-[1.03] md:-translate-y-1 z-10"
              >
                {/* Premium background glow effect */}
                <div className="absolute -inset-1 bg-blue-500/20 blur-xl opacity-30 rounded-xl"></div>

                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-[#3b82f6] text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                    Doporučeno
                  </div>
                </div>
                <div className="relative z-1 p-5 sm:p-6 flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 mr-3 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-[#3b82f6]" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold">Premium</h3>
                  </div>
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-bold">
                      {billingCycle === "yearly" ? "79 Kč" : "99 Kč"}
                    </span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      / měsíc
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5 sm:mb-6">
                    Kompletní sada nástrojů pro náročné čtenáře
                  </p>

                  <Button
                    className={`w-full mb-6 sm:mb-8 py-5 ${
                      currentTier === "premium"
                        ? "bg-blue-600/10 text-blue-500"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                    } rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300`}
                    variant={currentTier === "premium" ? "outline" : "default"}
                    onClick={() => handleChangeTier("premium")}
                    disabled={
                      currentTier === "premium" ||
                      loading ||
                      selectedTier !== null
                    }
                  >
                    {selectedTier === "premium" ? (
                      <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin mx-auto"></div>
                    ) : currentTier === "premium" ? (
                      <span className="flex items-center justify-center font-medium">
                        Aktivní plán <Check className="ml-2 h-4 w-4" />
                      </span>
                    ) : (
                      <span className="flex items-center justify-center font-medium">
                        Vybrat plán
                      </span>
                    )}
                  </Button>

                  <div className="text-xs uppercase tracking-wider mb-4 font-medium text-[#3b82f6] border-t border-[#2a3548] pt-4">
                    ZAHRNUJE
                  </div>
                  <ul className="space-y-2.5 sm:space-y-3">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        Neomezený počet knih v knihovně
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        <span className="font-medium">
                          {SUBSCRIPTION_LIMITS.premium.aiCreditsPerMonth} AI
                          kreditů
                        </span>{" "}
                        měsíčně
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        <span className="font-medium">
                          Pokročilé AI přizpůsobení
                        </span>{" "}
                        poznámek
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        <span className="font-medium">
                          Detailní informace o autorech
                        </span>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        <span className="font-medium">
                          Rozšířené AI shrnutí
                        </span>{" "}
                        knih
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        <span className="font-medium">Prioritní podpora</span>
                      </span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div
            variants={itemVariants}
            className="max-w-3xl mx-auto mt-16 md:mt-20"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">
              Často kladené otázky
            </h2>
            <div className="space-y-4 md:space-y-6">
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="bg-[#1a2436] border border-[#2a3548] rounded-lg p-5 md:p-6 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <h3 className="font-bold text-lg md:text-xl mb-2">
                  Co jsou AI kredity?
                </h3>
                <p className="text-gray-300 text-sm md:text-base">
                  AI kredity jsou využívány pro generování obsahu pomocí umělé
                  inteligence. Každé použití AI funkcí (jako je generování
                  shrnutí knih nebo informací o autorech) spotřebuje jeden
                  kredit. Kredity se obnovují každý měsíc podle vašeho
                  předplatného.
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="bg-[#1a2436] border border-[#2a3548] rounded-lg p-5 md:p-6 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <h3 className="font-bold text-lg md:text-xl mb-2">
                  Jak mohu změnit své předplatné?
                </h3>
                <p className="text-gray-300 text-sm md:text-base">
                  Jednoduše vyberte požadovaný plán výše a klikněte na
                  &quot;Vybrat plán&quot;. Změna bude provedena okamžitě a nové
                  funkce budou ihned dostupné. Při snížení úrovně předplatného
                  můžete ztratit přístup k některým funkcím a datům.
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="bg-[#1a2436] border border-[#2a3548] rounded-lg p-5 md:p-6 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <h3 className="font-bold text-lg md:text-xl mb-2">
                  Kdy se obnoví moje AI kredity?
                </h3>
                <p className="text-gray-300 text-sm md:text-base">
                  AI kredity se obnovují automaticky na začátku každého
                  předplatného cyklu. Nevyužité kredity z předchozího období se
                  nepřenášejí do následujícího cyklu.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
