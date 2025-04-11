"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookText,
  BookOpen,
  Sparkles,
  PenLine,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SubscriptionCard from "@/components/SubscriptionCard";
import LandingNavbar from "@/components/LandingNavbar";
import LoginForm from "@/components/LoginForm";
import FAQ from "@/components/FAQ";
import { SUBSCRIPTION_LIMITS } from "@/types/user";
import "@/styles/animations.css";
import TextReveal from "@/components/TextReveal";
import ScrollIndicator from "@/components/ScrollIndicator";

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [yearlyBilling, setYearlyBilling] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* Content with higher z-index */}
      <div className="relative z-10">
        <div className="w-full relative overflow-visible min-h-screen flex flex-col">
          {/* Landing page navbar */}
          <LandingNavbar scrollY={scrollY} scrollToSection={scrollToSection} />

          <main className="flex-grow">
            <section className="py-12 md:py-24 lg:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="text-center lg:text-left flex flex-col gap-6">
                  {/* Replace LandingAnimations with direct content since we now have 3D animations */}
                  <div>
                    <TextReveal
                      type="words"
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
                    >
                      Vytvářejte své{" "}
                      <span className="text-primary relative inline-block gradient-text">
                        čtenářské zápisky
                        <span className="absolute -bottom-2 left-0 right-0 h-1 bg-primary/50 rounded-full"></span>
                      </span>{" "}
                      jednoduše
                    </TextReveal>
                  </div>

                  <div>
                    <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                      Zapisujte si poznámky k povinné četbě, generujte shrnutí
                      knih a autorů, a exportujte své zápisky do PDF.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Button
                      size="lg"
                      className="transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95 hover-glow"
                      onClick={() => {
                        const element =
                          document.getElementById("signup-section");
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                    >
                      Začít zdarma
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="transition-all duration-300 hover:shadow-md hover:bg-primary/10 active:scale-95 hover-glow"
                      onClick={() => {
                        const element =
                          document.getElementById("features-section");
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                    >
                      Prozkoumat funkce
                    </Button>
                  </div>

                  <div className="pt-4">
                    <ScrollIndicator
                      targetId="features-section"
                      className="mx-auto lg:mx-0 mt-4"
                    />
                  </div>
                </div>

                {/* Image placeholder */}
                <div className="relative w-full h-[400px] rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-card/60 to-card border border-border hover:shadow-xl transition-all duration-500 group flex items-center justify-center">
                  <div className="text-center p-8">
                    <ImageIcon className="h-16 w-16 mb-4 text-muted-foreground/50 mx-auto" />
                    <p className="text-muted-foreground text-lg">
                      Obrázek bude přidán později
                    </p>
                    <p className="text-muted-foreground/70 text-sm mt-2">
                      Vlastní ilustrace čtenářských zápisků
                    </p>
                  </div>
                  {/* Gradient overlay for aesthetic */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-60 pointer-events-none"></div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section
              id="features-section"
              className="py-12 sm:py-16 md:py-24 lg:py-32 relative"
            >
              <div className="container max-w-7xl mx-auto px-6 sm:px-8">
                <div className="text-center mb-10 sm:mb-16">
                  <motion.h2
                    className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                  >
                    Funkce navržené pro{" "}
                    <span className="text-foreground">studenty</span>
                  </motion.h2>
                  <motion.p
                    className="mt-4 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    Vše, co potřebujete pro efektivní organizaci povinné četby a
                    přípravu do školy
                  </motion.p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                  {/* Feature 1 */}
                  <motion.div
                    className="glass-card glass-card-hover group relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <div className="bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <BookText className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-semibold mb-3 group-hover:text-primary transition-colors duration-300">
                        Poznámky ke knihám
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Uchovávejte všechny své poznámky k povinné četbě na
                        jednom místě a mějte je vždy po ruce pro přípravu do
                        školy.
                      </p>
                    </div>
                  </motion.div>

                  {/* Feature 2 */}
                  <motion.div
                    className="glass-card glass-card-hover group relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <div className="bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-semibold mb-3 group-hover:text-primary transition-colors duration-300">
                        Generování shrnutí
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Získejte AI generovaná shrnutí knih a informace o
                        autorech pro rychlejší a efektivnější přípravu na testy.
                      </p>
                    </div>
                  </motion.div>

                  {/* Feature 3 */}
                  <motion.div
                    className="glass-card glass-card-hover group relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <div className="bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <PenLine className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-semibold mb-3 group-hover:text-primary transition-colors duration-300">
                        Export do PDF
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Exportujte své poznámky do PDF formátu pro snadné
                        sdílení nebo tisk při přípravě na hodiny literatury.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Pricing Section */}
            <section
              id="pricing-section"
              className="py-16 md:py-24 relative overflow-hidden"
            >
              <div className="container max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
                  <motion.h2
                    className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    Vyberte si plán, který vám vyhovuje
                  </motion.h2>
                  <motion.p
                    className="text-muted-foreground text-lg md:text-xl mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    Získejte přístup k pokročilým funkcím, které vám pomohou s
                    přípravou do školy.
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
                        <motion.span
                          className="inline-flex items-center ml-1 yearly-discount"
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
                      </button>
                    </div>

                    {yearlyBilling && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center text-sm text-emerald-400 font-medium"
                      >
                        <Sparkles className="h-4 w-4 mr-2 text-emerald-400" />
                        <span className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-transparent bg-clip-text">
                          Ušetříte 20% s ročním předplatným
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                {/* Pricing Cards Container with flex wrapper */}
                <div className="flex justify-center w-full">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl w-full px-0 sm:px-4">
                    {/* Free Plan */}
                    <SubscriptionCard
                      title="Základní"
                      subtitle="Pro začátek"
                      description="Základní funkce pro správu zápisků"
                      price="0 Kč"
                      pricePeriod=""
                      icon={
                        <BookText className="h-6 w-6 text-muted-foreground" />
                      }
                      badge={{
                        text: "Zdarma",
                        color: "bg-[#2a3548] text-muted-foreground",
                      }}
                      isCurrentPlan={false}
                      isLoading={false}
                      isSelected={false}
                      accentColor="#6b7280"
                      mutedColor="#6b7280"
                      buttonText="Začít zdarma"
                      onSelect={() => scrollToSection("signup-section")}
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

                    {/* Basic Plan */}
                    <SubscriptionCard
                      title="Basic"
                      subtitle="Pro aktivní čtenáře"
                      description="Rozšířené funkce pro efektivnější práci"
                      price={yearlyBilling ? "39" : "49"}
                      pricePeriod="/ měsíc"
                      icon={<BookOpen className="h-6 w-6 text-[#3b82f6]" />}
                      badge={{
                        text: "Populární",
                        color: "bg-[#2a3548] text-[#3b82f6]",
                      }}
                      isCurrentPlan={false}
                      isLoading={false}
                      isSelected={false}
                      accentColor="#3b82f6"
                      mutedColor="#3b82f6"
                      buttonText="Vyzkoušet Basic"
                      onSelect={() => scrollToSection("signup-section")}
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

                    {/* Premium Plan */}
                    <SubscriptionCard
                      title="Premium"
                      subtitle="Pro vášnivé čtenáře"
                      description="Plný přístup ke všem funkcím bez omezení"
                      price={yearlyBilling ? "63" : "79"}
                      pricePeriod="/ měsíc"
                      icon={<Sparkles className="h-6 w-6 text-[#3b82f6]" />}
                      badge={{
                        text: "Doporučeno",
                        color: "bg-[#3b82f6] text-white",
                      }}
                      isCurrentPlan={false}
                      isLoading={false}
                      isSelected={false}
                      accentColor="#3b82f6"
                      mutedColor="#3b82f6"
                      buttonText="Získat Premium"
                      onSelect={() => scrollToSection("signup-section")}
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
                </div>

                <motion.div
                  className="mt-10 sm:mt-16 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                    Všechny plány zahrnují základní funkce pro správu
                    čtenářských zápisků. Předplatné můžete zrušit kdykoliv.
                    {yearlyBilling &&
                      " Při ročním předplatném ušetříte 20% oproti měsíční platbě."}
                  </p>
                </motion.div>
              </div>
            </section>

            {/* FAQ Section */}
            <section
              id="faq-section"
              className="py-16 sm:py-20 md:py-24 lg:py-28 relative"
            >
              <div className="container max-w-7xl mx-auto px-6 sm:px-8">
                <FAQ />
              </div>
            </section>

            {/* Signup Section */}
            <section
              id="signup-section"
              className="py-16 sm:py-20 md:py-28 lg:py-32 relative overflow-hidden"
            >
              <div className="container max-w-7xl mx-auto px-6 sm:px-8">
                <div className="flex flex-col lg:flex-row gap-10 sm:gap-12 lg:gap-16 items-center justify-center">
                  <div className="flex-1 max-w-lg space-y-5 sm:space-y-6 text-center lg:text-left">
                    <motion.h2
                      className="text-2xl sm:text-3xl md:text-4xl font-bold"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                    >
                      Připojte se k čtenářské komunitě
                    </motion.h2>
                    <motion.p
                      className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      Vytvořte si účet a začněte organizovat svou povinnou četbu
                      již dnes.
                    </motion.p>
                  </div>

                  <div className="flex-1 w-full max-w-sm">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="w-full"
                    >
                      <LoginForm />
                    </motion.div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
