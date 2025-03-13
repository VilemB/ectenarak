"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import SubscriptionManager from "@/components/SubscriptionManager";
import ExampleUsage from "@/components/ExampleUsage";
import { CheckCircle } from "lucide-react";

export default function SubscriptionPage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Debug logging
  useEffect(() => {
    console.log("Auth state:", { user, isLoading, isAuthenticated });
  }, [user, isLoading, isAuthenticated]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-blue-500 animate-spin mb-4"></div>
        <p className="text-gray-300 ml-3">Načítání předplatného...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-[#0f1729] via-[#111a2f] to-[#0f1729] text-white min-h-screen">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 pointer-events-none"></div>

      {/* Subtle glow effects */}
      <div className="fixed top-0 left-1/4 w-1/2 h-1/2 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-1/2 h-1/2 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
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

          {/* Subscription Manager */}
          <motion.div variants={itemVariants}>
            <SubscriptionManager />
          </motion.div>

          {/* Features Section */}
          <motion.div
            variants={itemVariants}
            className="pt-16 border-t border-[#2a3548]/50"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Co získáte s předplatným
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Porovnejte dostupné funkce a vyberte si plán, který nejlépe
                vyhovuje vašim potřebám.
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
