"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, BookText, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useSubscription } from "@/hooks/useSubscription";
import { SUBSCRIPTION_LIMITS } from "@/types/user";
import AiCreditsDisplay from "@/components/AiCreditsDisplay";
import SubscriptionCard from "@/components/SubscriptionCard";
import LoginForm from "@/components/LoginForm";

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

  // Show login form if not authenticated
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="text-white min-h-screen flex flex-col">
        {/* Subtle background pattern */}
        <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 pointer-events-none z-[-1]"></div>

        {/* Background gradient overlay */}
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

            {/* Subscription tiers using the SubscriptionCard component */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto px-2">
              {/* Free tier */}
              <SubscriptionCard
                title="Základní"
                subtitle="Pro začátek"
                description="Základní funkce pro správu zápisků"
                price="0 Kč"
                pricePeriod=""
                icon={<BookText className="h-6 w-6 text-muted-foreground" />}
                badge={{
                  text: "Zdarma",
                  color: "bg-[#2a3548] text-muted-foreground",
                }}
                isCurrentPlan={currentTier === "free"}
                isLoading={loading}
                isSelected={selectedTier === "free"}
                accentColor="#6b7280"
                mutedColor="#6b7280"
                onSelect={() => handleChangeTier("free")}
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
              />

              {/* Basic tier */}
              <SubscriptionCard
                title="Basic"
                subtitle="Pro aktivní čtenáře"
                description="Rozšířené funkce pro efektivnější práci"
                price={billingCycle === "yearly" ? "39" : "49"}
                pricePeriod="/ měsíc"
                icon={<BookOpen className="h-6 w-6 text-[#3b82f6]" />}
                badge={{
                  text: "Populární",
                  color: "bg-[#2a3548] text-[#3b82f6]",
                }}
                isCurrentPlan={currentTier === "basic"}
                isLoading={loading}
                isSelected={selectedTier === "basic"}
                accentColor="#3b82f6"
                mutedColor="#3b82f6"
                onSelect={() => handleChangeTier("basic")}
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
              />

              {/* Premium tier */}
              <SubscriptionCard
                title="Premium"
                subtitle="Pro vášnivé čtenáře"
                description="Kompletní sada nástrojů pro náročné čtenáře"
                price={billingCycle === "yearly" ? "63" : "79"}
                pricePeriod="/ měsíc"
                icon={<Sparkles className="h-6 w-6 text-[#3b82f6]" />}
                badge={{
                  text: "Doporučeno",
                  color: "bg-[#3b82f6] text-white",
                }}
                isCurrentPlan={currentTier === "premium"}
                isLoading={loading}
                isSelected={selectedTier === "premium"}
                accentColor="#3b82f6"
                mutedColor="#3b82f6"
                onSelect={() => handleChangeTier("premium")}
                isPremium={true}
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
              />
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
