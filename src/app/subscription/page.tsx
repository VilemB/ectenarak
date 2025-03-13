"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import ExampleUsage from "@/components/ExampleUsage";
import { Sparkles, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SubscriptionPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    console.log("Auth state:", { user, isLoading, isAuthenticated });
  }, [user, isLoading, isAuthenticated]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("User not authenticated, redirecting to login...");
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

  const handleSubscribe = (plan: string) => {
    setSelectedPlan(plan);

    console.log(`Selected plan: ${plan}`);

    // You could redirect to a checkout page here
    // router.push(`/checkout?plan=${plan}`);
  };

  const handleUpgrade = () => {
    if (!selectedPlan) {
      alert("Prosím vyberte plán");
      return;
    }

    alert(
      `Váš plán byl změněn na ${selectedPlan} (${
        yearlyBilling ? "roční" : "měsíční"
      })`
    );
    // Here you would implement the actual subscription upgrade logic
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 flex-grow">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-20"
        >
          {/* Header */}
          <motion.div
            variants={itemVariants}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
              Vyberte si ideální plán
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              Odemkněte plný potenciál vaší čtenářské cesty s naším prémiovým
              předplatným.
            </p>
          </motion.div>

          {/* Landing Page Style Pricing */}
          <motion.div variants={itemVariants}>
            <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
              <motion.h2
                className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {user ? "Změnit předplatné" : "Vyberte si plán"}
              </motion.h2>
              <motion.p
                className="text-muted-foreground text-lg md:text-xl mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Vyberte si plán, který nejlépe vyhovuje vašim potřebám
              </motion.p>

              {/* Simple Pricing Toggle */}
              <motion.div
                className="flex flex-col items-center justify-center mb-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center space-x-3 bg-[#1a2436] p-1.5 rounded-full border border-[#2a3548] shadow-sm mb-3">
                  <button
                    onClick={() => setYearlyBilling(false)}
                    className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      !yearlyBilling
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-[#2a3548]/50"
                    }`}
                  >
                    Měsíčně
                  </button>
                  <button
                    onClick={() => setYearlyBilling(true)}
                    className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      yearlyBilling
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-[#2a3548]/50"
                    }`}
                  >
                    Ročně{" "}
                    <span className="text-xs opacity-90 ml-1">(-20%)</span>
                  </button>
                </div>

                {yearlyBilling && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center text-sm text-primary font-medium"
                  >
                    <Sparkles className="h-4 w-4 mr-2 text-primary" />
                    Ušetříte 20% s ročním předplatným
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Pricing Cards */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {/* Free Plan */}
              <motion.div
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                className="relative rounded-2xl overflow-hidden backdrop-blur-md bg-gradient-to-b from-gray-900/80 to-gray-950/80 border border-gray-800 shadow-xl flex flex-col h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 to-gray-900/10 pointer-events-none"></div>
                <div className="p-8 flex flex-col flex-grow">
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-100">
                      Základní
                    </h3>
                    <div className="flex items-baseline mb-6">
                      <span className="text-5xl font-extrabold text-white">
                        0 Kč
                      </span>
                      <span className="ml-2 text-gray-400">navždy</span>
                    </div>
                    <ul className="space-y-4 mb-8">
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-400 mr-3" />
                        <span>Až 20 knih v knihovně</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-400 mr-3" />
                        <span>Manuální poznámky ke knihám</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-400 mr-3" />
                        <span>
                          <span className="font-medium">3 AI kredity</span>{" "}
                          měsíčně
                        </span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-400 mr-3" />
                        <span>Jednoduchý formát poznámek</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-auto">
                    <Button
                      variant="outline"
                      className="w-full py-6 text-lg border-gray-700 hover:bg-gray-800/50 text-gray-300"
                      onClick={() => router.push("/dashboard")}
                    >
                      Pokračovat zdarma
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Standard Plan */}
              <motion.div
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                className="relative rounded-2xl overflow-hidden backdrop-blur-md bg-gradient-to-b from-blue-900/80 to-blue-950/80 border border-blue-800/50 shadow-xl flex flex-col h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-700/10 pointer-events-none"></div>
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="p-8 flex flex-col flex-grow">
                  <div>
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-blue-900/80 text-blue-200 text-xs font-medium px-3 py-1 rounded-full">
                        Populární
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-blue-100">
                      Basic
                    </h3>
                    <div className="flex items-baseline mb-6">
                      <span className="text-5xl font-extrabold text-white">
                        {yearlyBilling ? "39 Kč" : "49 Kč"}
                      </span>
                      <span className="ml-2 text-gray-400">/ měsíc</span>
                    </div>
                    <ul className="space-y-4 mb-8">
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-blue-400 mr-3" />
                        <span>Až 100 knih v knihovně</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-blue-400 mr-3" />
                        <span>
                          <span className="font-medium">50 AI kreditů</span>{" "}
                          měsíčně
                        </span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-blue-400 mr-3" />
                        <span>
                          <span className="font-medium">AI shrnutí autorů</span>{" "}
                          a jejich děl
                        </span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-blue-400 mr-3" />
                        <span>
                          <span className="font-medium">
                            Export poznámek do PDF
                          </span>
                        </span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-blue-400 mr-3" />
                        <span>Pokročilý formát poznámek</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-auto">
                    <Button
                      className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-600/20"
                      onClick={() => handleSubscribe("basic")}
                    >
                      Vybrat plán
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Premium Plan */}
              <motion.div
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                className="relative rounded-2xl overflow-hidden backdrop-blur-md bg-gradient-to-b from-purple-900/80 to-purple-950/80 border border-purple-800/50 shadow-xl flex flex-col h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-700/10 pointer-events-none"></div>
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="p-8 flex flex-col flex-grow">
                  <div>
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-purple-900/80 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Doporučeno
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-purple-100">
                      Premium
                    </h3>
                    <div className="flex items-baseline mb-6">
                      <span className="text-5xl font-extrabold text-white">
                        {yearlyBilling ? "63 Kč" : "79 Kč"}
                      </span>
                      <span className="ml-2 text-gray-400">/ měsíc</span>
                    </div>
                    <ul className="space-y-4 mb-8">
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-purple-400 mr-3" />
                        <span>Neomezený počet knih</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-purple-400 mr-3" />
                        <span>100 AI kreditů měsíčně</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-purple-400 mr-3" />
                        <span>Pokročilá AI shrnutí s delším rozsahem</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-purple-400 mr-3" />
                        <span>Detailní informace o autorech</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-purple-400 mr-3" />
                        <span>Přizpůsobení AI shrnutí</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-purple-400 mr-3" />
                        <span>Export poznámek do PDF</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-auto">
                    <Button
                      className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-600/20"
                      onClick={() => handleSubscribe("premium")}
                    >
                      Vybrat plán
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Upgrade Button */}
            <div className="mt-10 flex justify-center">
              <motion.button
                onClick={handleUpgrade}
                disabled={!selectedPlan}
                className={`px-10 py-4 rounded-full font-medium text-white transition-all ${
                  selectedPlan
                    ? "bg-[#3b82f6] hover:bg-[#3b82f6]/90"
                    : "bg-[#2a3548] cursor-not-allowed"
                }`}
                whileHover={selectedPlan ? { scale: 1.05 } : {}}
                whileTap={selectedPlan ? { scale: 0.95 } : {}}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  boxShadow: selectedPlan
                    ? "0 10px 25px -5px rgba(59, 130, 246, 0.5)"
                    : "none",
                }}
                transition={{ duration: 0.3 }}
              >
                <span className="flex items-center justify-center text-lg">
                  {user ? "Změnit předplatné" : "Aktivovat předplatné"}
                  <Sparkles className="ml-2 h-5 w-5" />
                </span>
              </motion.button>
            </div>

            {selectedPlan && (
              <motion.div
                className="mt-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm text-[#3b82f6]">
                  {selectedPlan === "Free"
                    ? "Vybrali jste Free plán"
                    : `Vybrali jste ${selectedPlan} plán (${
                        yearlyBilling ? "roční" : "měsíční"
                      })`}
                </p>
              </motion.div>
            )}

            <motion.div
              className="mt-10 sm:mt-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Všechny plány zahrnují základní funkce pro správu čtenářských
                zápisků. Předplatné můžete zrušit kdykoliv.
                {yearlyBilling &&
                  " Při ročním předplatném ušetříte 20% oproti měsíční platbě."}
              </p>
            </motion.div>
          </motion.div>

          {/* Features Section */}
          <motion.div
            variants={itemVariants}
            className="relative rounded-2xl overflow-hidden backdrop-blur-md bg-gradient-to-b from-gray-900/60 to-gray-950/60 border border-gray-800/50 shadow-xl p-8 md:p-12"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="text-center mb-12 relative z-10">
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200">
                Vyzkoušejte prémiové funkce
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Podívejte se na ukázky funkcí, které získáte s předplatným.
              </p>
            </div>

            <ExampleUsage />
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            variants={itemVariants}
            className="relative rounded-2xl overflow-hidden backdrop-blur-md bg-gradient-to-b from-gray-900/60 to-gray-950/60 border border-gray-800/50 shadow-xl p-8 md:p-12"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="text-center mb-12 relative z-10">
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200">
                Často kladené otázky
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Odpovědi na nejčastější dotazy o našem předplatném.
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-6 relative z-10">
              {/* FAQ Item 1 */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6 shadow-lg"
              >
                <h3 className="text-xl font-semibold mb-3 text-white">
                  Jak mohu zrušit předplatné?
                </h3>
                <p className="text-gray-300">
                  Předplatné můžete kdykoliv zrušit ve svém profilu. Po zrušení
                  budete moci využívat prémiové funkce až do konce aktuálního
                  fakturačního období.
                </p>
              </motion.div>

              {/* FAQ Item 2 */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6 shadow-lg"
              >
                <h3 className="text-xl font-semibold mb-3 text-white">
                  Co jsou AI kredity?
                </h3>
                <p className="text-gray-300">
                  AI kredity slouží k využívání funkcí umělé inteligence, jako
                  je generování shrnutí knih nebo analýza textu. Každý plán
                  obsahuje určitý počet kreditů, které se obnovují každý měsíc.
                </p>
              </motion.div>

              {/* FAQ Item 3 */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6 shadow-lg"
              >
                <h3 className="text-xl font-semibold mb-3 text-white">
                  Mohu změnit svůj plán?
                </h3>
                <p className="text-gray-300">
                  Ano, svůj plán můžete kdykoliv upgradovat nebo downgradovat.
                  Změny se projeví na začátku dalšího fakturačního období.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
