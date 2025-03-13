"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import ExampleUsage from "@/components/ExampleUsage";
import { CheckCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

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

  const handleSelectPlan = (plan: string) => {
    setSelectedPlan(plan);
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
    <div className="bg-gradient-to-b from-[#0f1729] via-[#111a2f] to-[#0f1729] text-white min-h-screen">
      {/* Subtle background pattern - fixed z-index issue */}
      <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 pointer-events-none z-0"></div>

      {/* Subtle glow effects - fixed z-index issue */}
      <div className="fixed top-0 left-1/4 w-1/2 h-1/2 bg-blue-600/5 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-1/4 w-1/2 h-1/2 bg-purple-600/5 rounded-full blur-3xl pointer-events-none z-0"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-1">
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

            {/* Pricing Cards Container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <motion.div
                className={`bg-[#1a2436] border-2 ${
                  selectedPlan === "Free"
                    ? "border-[#3b82f6]"
                    : "border-[#2a3548]"
                } rounded-xl overflow-hidden shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 relative flex flex-col h-full ${
                  selectedPlan === "Free" ? "ring-2 ring-[#3b82f6]/50" : ""
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                onClick={() => handleSelectPlan("Free")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-[#2a3548] text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Zdarma
                  </div>
                </div>
                <div className="p-6 sm:p-8 flex flex-col h-full">
                  <div className="flex items-baseline mb-4 sm:mb-6">
                    <span className="text-4xl sm:text-5xl font-bold">0 Kč</span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      navždy
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 sm:mb-8">
                    Základní funkce pro správu zápisků
                  </p>
                  <div className="flex items-center mb-8 sm:mb-10">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                        selectedPlan === "Free"
                          ? "border-[#3b82f6] bg-[#3b82f6]/10"
                          : "border-[#2a3548]"
                      } mr-3`}
                    >
                      {selectedPlan === "Free" && (
                        <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        selectedPlan === "Free"
                          ? "text-[#3b82f6]"
                          : "text-gray-300"
                      }`}
                    >
                      {selectedPlan === "Free" ? "Vybráno" : "Vybrat Free plán"}
                    </span>
                  </div>
                  <div className="text-xs uppercase tracking-wider mb-4 sm:mb-6 font-medium text-[#6b7280] border-t border-[#2a3548] pt-4 sm:pt-6">
                    ZAHRNUJE
                  </div>
                  <ul className="space-y-3 sm:space-y-4">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-muted-foreground mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">Až 5 knih v knihovně</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-muted-foreground mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        Manuální poznámky ke knihám
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-muted-foreground mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        <span className="font-medium">3 AI kredity</span>{" "}
                        měsíčně
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-muted-foreground mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        Jednoduchý formát poznámek
                      </span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Basic Plan */}
              <motion.div
                className={`bg-[#1a2436] border-2 ${
                  selectedPlan === "Basic"
                    ? "border-[#3b82f6]"
                    : "border-[#2a3548]"
                } rounded-xl overflow-hidden shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 relative flex flex-col h-full ${
                  selectedPlan === "Basic" ? "ring-2 ring-[#3b82f6]/50" : ""
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                onClick={() => handleSelectPlan("Basic")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-[#2a3548] text-[#3b82f6] text-xs font-medium px-3 py-1 rounded-full">
                    Populární
                  </div>
                </div>
                <div className="p-6 sm:p-8 flex flex-col h-full">
                  <div className="flex items-baseline mb-4 sm:mb-6">
                    <span className="text-4xl sm:text-5xl font-bold">
                      {yearlyBilling ? "39 Kč" : "49 Kč"}
                    </span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      / měsíc
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 sm:mb-8">
                    Rozšířené funkce pro efektivnější práci
                  </p>
                  <div className="flex items-center mb-8 sm:mb-10">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                        selectedPlan === "Basic"
                          ? "border-[#3b82f6] bg-[#3b82f6]/10"
                          : "border-[#2a3548]"
                      } mr-3`}
                    >
                      {selectedPlan === "Basic" && (
                        <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        selectedPlan === "Basic"
                          ? "text-[#3b82f6]"
                          : "text-gray-300"
                      }`}
                    >
                      {selectedPlan === "Basic"
                        ? "Vybráno"
                        : "Vybrat Basic plán"}
                    </span>
                  </div>
                  <div className="text-xs uppercase tracking-wider mb-4 sm:mb-6 font-medium text-[#3b82f6] border-t border-[#2a3548] pt-4 sm:pt-6">
                    ZAHRNUJE
                  </div>
                  <ul className="space-y-3 sm:space-y-4">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">Až 50 knih v knihovně</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        <span className="font-medium">50 AI kreditů</span>{" "}
                        měsíčně
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        <span className="font-medium">AI shrnutí autorů</span> a
                        jejich děl
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        <span className="font-medium">
                          Export poznámek do PDF
                        </span>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">Pokročilý formát poznámek</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Premium Plan */}
              <motion.div
                className={`bg-[#1a2436] border-2 ${
                  selectedPlan === "Premium"
                    ? "border-[#3b82f6]"
                    : selectedPlan
                    ? "border-[#2a3548]"
                    : "border-[#3b82f6]"
                } rounded-xl overflow-hidden shadow-md hover:shadow-xl cursor-pointer transition-all duration-300 relative flex flex-col h-full md:scale-[1.03] md:-translate-y-1 ${
                  selectedPlan === "Premium" ? "ring-2 ring-[#3b82f6]/50" : ""
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                onClick={() => handleSelectPlan("Premium")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-[#3b82f6] text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                    Doporučeno
                  </div>
                </div>
                <div className="p-6 sm:p-8 flex flex-col h-full">
                  <div className="flex items-baseline mb-4 sm:mb-6">
                    <span className="text-4xl sm:text-5xl font-bold">
                      {yearlyBilling ? "63 Kč" : "79 Kč"}
                    </span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      / měsíc
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 sm:mb-8">
                    Plný přístup ke všem funkcím bez omezení
                  </p>
                  <div className="flex items-center mb-8 sm:mb-10">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                        selectedPlan === "Premium"
                          ? "border-[#3b82f6] bg-[#3b82f6]/10"
                          : "border-[#2a3548]"
                      } mr-3`}
                    >
                      {selectedPlan === "Premium" && (
                        <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        selectedPlan === "Premium"
                          ? "text-[#3b82f6]"
                          : "text-gray-300"
                      }`}
                    >
                      {selectedPlan === "Premium"
                        ? "Vybráno"
                        : "Vybrat Premium plán"}
                    </span>
                  </div>
                  <div className="text-xs uppercase tracking-wider mb-4 sm:mb-6 font-medium text-[#3b82f6] border-t border-[#2a3548] pt-4 sm:pt-6">
                    ZAHRNUJE VŠE Z BASIC A NAVÍC
                  </div>
                  <ul className="space-y-3 sm:space-y-4">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">Neomezený počet knih</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">100 AI kreditů měsíčně</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        Pokročilá AI shrnutí s delším rozsahem
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">
                        Detailní informace o autorech
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">Přizpůsobení AI shrnutí</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-[#3b82f6] mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm">Export poznámek do PDF</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>

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
            className="pt-16 border-t border-[#2a3548]/50"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                Vyzkoušejte prémiové funkce
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Podívejte se na ukázky funkcí, které získáte s předplatným
              </p>
            </div>

            <ExampleUsage />
          </motion.div>

          {/* FAQ Section */}
          <motion.div variants={itemVariants} className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Často kladené otázky
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  question: "Jak mohu změnit své předplatné?",
                  answer:
                    "Své předplatné můžete kdykoliv změnit v sekci Předplatné. Změny se projeví okamžitě a budou účtovány poměrně k zbývajícímu období.",
                },
                {
                  question: "Mohu zrušit předplatné kdykoliv?",
                  answer:
                    "Ano, své předplatné můžete kdykoliv zrušit. Budete moci využívat prémiové funkce až do konce aktuálního fakturačního období.",
                },
                {
                  question: "Co jsou AI kredity a jak je mohu využít?",
                  answer:
                    "AI kredity vám umožňují využívat funkce umělé inteligence, jako je generování shrnutí knih nebo analýza textu. Každý plán obsahuje určitý počet kreditů, které se obnovují každý měsíc.",
                },
              ].map((faq, index) => (
                <div
                  key={index}
                  className="border-b border-[#2a3548]/50 pb-4 last:border-0"
                >
                  <h3 className="text-xl font-semibold mb-2 flex items-center">
                    <CheckCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                    {faq.question}
                  </h3>
                  <p className="text-gray-300 pl-7">{faq.answer}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
