"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, BookText, Sparkles, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubscriptionCard from "@/components/SubscriptionCard";
import LandingNavbar from "@/components/LandingNavbar";
import LoginForm from "@/components/LoginForm";
import FAQ from "@/components/FAQ";
import { SUBSCRIPTION_LIMITS } from "@/types/user";
import "@/styles/animations.css";
import TextReveal from "@/components/TextReveal";
import ScrollIndicator from "@/components/ScrollIndicator";
import { useAuth } from "@/contexts/AuthContext";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";

// Initialize Stripe outside of the component render cycle
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

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
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Updated function to handle subscription selection
  const handleSubscriptionSelect = async (
    tier: "free" | "basic" | "premium"
  ) => {
    const planKey = `${tier}-${yearlyBilling ? "yearly" : "monthly"}`;
    setIsLoading((prev) => ({ ...prev, [planKey]: true }));

    if (!isAuthenticated) {
      // If not logged in, scroll to signup section
      scrollToSection("signup-section");
      // Store intended subscription tier in sessionStorage
      if (tier !== "free") {
        sessionStorage.setItem("intendedSubscription", tier);
        sessionStorage.setItem("yearlyBilling", yearlyBilling.toString());
      }
      setIsLoading((prev) => ({ ...prev, [planKey]: false }));
      return;
    }

    // If logged in and selecting a paid tier, create checkout session
    if (tier !== "free") {
      try {
        // Determine the price ID based on selection
        let priceId;
        if (tier === "basic") {
          priceId = yearlyBilling
            ? process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID
            : process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID;
        } else if (tier === "premium") {
          priceId = yearlyBilling
            ? process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID
            : process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID;
        }

        if (!priceId) {
          throw new Error("Could not determine Price ID.");
        }

        // Call the API route to create a checkout session
        const response = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ priceId }),
        });

        const sessionData = await response.json();

        if (!response.ok) {
          throw new Error(
            sessionData.error || "Failed to create checkout session."
          );
        }

        if (!sessionData.id) {
          throw new Error("Received invalid session data from server.");
        }

        // Get Stripe.js instance
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error("Stripe.js has not loaded yet.");
        }

        // Redirect to Stripe Checkout
        const { error } = await stripe.redirectToCheckout({
          sessionId: sessionData.id,
        });

        if (error) {
          // If `redirectToCheckout` fails due to a browser or network
          // error, display the localized error message to your customer.
          console.error("Stripe redirectToCheckout error:", error);
          toast.error(error.message || "Přesměrování na platbu selhalo.");
        }
      } catch (error) {
        console.error("Subscription selection error:", error);
        const message =
          error instanceof Error ? error.message : "Neznámá chyba";
        toast.error(
          message ||
            "Nastala chyba při vytváření platební relace. Zkuste to prosím znovu."
        );
      } finally {
        setIsLoading((prev) => ({ ...prev, [planKey]: false }));
      }
    } else {
      // Handle free tier selection if necessary (e.g., redirect to dashboard)
      // For now, just reset loading state if it's the free tier
      setIsLoading((prev) => ({ ...prev, [planKey]: false }));
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* Content with higher z-index */}
      <div className="relative z-10">
        <div className="w-full relative overflow-visible min-h-screen flex flex-col">
          {/* Landing page navbar */}
          <LandingNavbar scrollY={scrollY} />

          <main className="flex-grow">
            <section className="py-12 md:py-24 lg:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:items-start">
                <div className="text-center lg:text-left flex flex-col gap-6">
                  {/* Replace LandingAnimations with direct content since we now have 3D animations */}
                  <div>
                    <TextReveal
                      type="words"
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground"
                    >
                      eČtenářák: Váš AI{" "}
                      <span className="relative inline-block">
                        <span className="bg-gradient-to-r from-primary to-blue-400 text-transparent bg-clip-text">
                          čtenářský deník
                        </span>
                      </span>{" "}
                      k maturitě
                    </TextReveal>
                  </div>

                  <div>
                    <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                      Zvládněte povinnou četbu k maturitě snadněji. Využijte AI
                      pro generování shrnutí děl i autorů, pište si poznámky a
                      mějte vše přehledně na jednom místě.
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
                      Začít s přípravou k maturitě
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

                {/* Responsive Image Showcase - Simplified */}
                <motion.div className="relative w-full flex flex-col items-center justify-center mt-8 lg:mt-0">
                  {/* Laptop Image - Large Screens Only */}
                  <motion.div
                    className="relative z-0 w-full hidden lg:block rounded-xl overflow-hidden shadow-lg border border-border/50 transition-shadow duration-300 hover:shadow-xl"
                    initial={{ opacity: 0, x: -50, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{
                      duration: 0.7,
                      delay: 0.2,
                      ease: "easeInOut",
                    }}
                  >
                    <Image
                      src="/images/laptop-homepage.png"
                      alt="eČtenářák na notebooku"
                      width={1000} // Provide base width
                      height={667} // Provide base height based on aspect ratio
                      layout="responsive"
                      priority
                    />
                  </motion.div>

                  {/* Phone Image - Small/Medium Screens Only */}
                  <motion.div
                    className="relative z-10 w-full block lg:hidden max-w-[180px] sm:max-w-[210px] mx-auto 
                               shadow-2xl rounded-lg overflow-hidden border-2 border-border/60 
                               transition-transform duration-500 hover:scale-105"
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.2, // Adjusted delay slightly for quicker appearance
                      type: "spring",
                      stiffness: 100,
                    }}
                  >
                    <Image
                      src="/images/phone-homepage.png"
                      alt="eČtenářák na mobilu"
                      width={300} // Provide base width
                      height={650} // Provide base height based on aspect ratio
                      layout="responsive"
                      quality={90}
                    />
                  </motion.div>
                </motion.div>
                {/* End Responsive Image Showcase */}
              </div>
            </section>

            {/* Features Section */}
            <section
              id="features-section"
              className="py-12 sm:py-16 md:py-24 lg:py-32 relative"
            >
              <div className="container max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="text-center mb-10 sm:mb-16">
                  <motion.h2
                    className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                  >
                    Nástroje pro{" "}
                    <span className="text-foreground">zvládnutí maturity</span>
                  </motion.h2>
                  <motion.p
                    className="mt-4 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    Vše, co potřebujete pro efektivní přípravu na maturitu z
                    češtiny.
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
                        Uchovávejte všechny své poznámky k maturitní četbě na
                        jednom místě. Mějte klíčové informace vždy po ruce pro
                        ústní zkoušku i písemnou práci.
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
                        AI Shrnutí a Analýzy
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Nerozumíte dílu nebo autorovi? Získejte AI generovaná
                        shrnutí a informace o autorech pro rychlé pochopení
                        kontextu a hlavních myšlenek.
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
                        Vytvořte si perfektní podklady. Exportujte své poznámky
                        a AI shrnutí do PDF pro snadné opakování a učení
                        offline.
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
                    Plány navržené pro maturanty
                  </motion.h2>
                  <motion.p
                    className="text-muted-foreground text-lg md:text-xl mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    Vyberte si úroveň podpory, která vám nejlépe pomůže uspět u
                    maturity.
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
                      description="Základní funkce pro přípravu čtenářských zápisků potřebných k maturitě"
                      price="0 Kč"
                      pricePeriod=""
                      badge={{
                        text: "Zdarma",
                        color: "bg-[#2a3548] text-muted-foreground",
                      }}
                      isCurrentPlan={false}
                      isLoading={isLoading["free-false"]}
                      isSelected={false}
                      buttonText="Začít zdarma"
                      onSelect={() => handleSubscriptionSelect("free")}
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
                      description="Rozšířené funkce pro důkladnou přípravu k maturitě a zvládnutí povinné četby"
                      price={yearlyBilling ? "39" : "49"}
                      pricePeriod="/ měsíc"
                      monthlyPrice={49}
                      isYearly={yearlyBilling}
                      badge={{
                        text: "Populární",
                        color: "bg-[#2a3548] text-[#3b82f6]",
                      }}
                      isCurrentPlan={false}
                      isLoading={isLoading[`basic-${yearlyBilling}`]}
                      isSelected={false}
                      buttonText={
                        isAuthenticated ? "Vybrat Basic" : "Začít s Basic"
                      }
                      onSelect={() => handleSubscriptionSelect("basic")}
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
                      description="Kompletní sada nástrojů pro perfektní přípravu k maturitě z literatury a dokonalé zvládnutí povinné četby"
                      price={yearlyBilling ? "63" : "79"}
                      pricePeriod="/ měsíc"
                      monthlyPrice={79}
                      isYearly={yearlyBilling}
                      badge={{
                        text: "Doporučeno",
                        color: "bg-[#3b82f6] text-white",
                      }}
                      isCurrentPlan={false}
                      isLoading={isLoading[`premium-${yearlyBilling}`]}
                      isSelected={false}
                      buttonText={
                        isAuthenticated ? "Vybrat Premium" : "Začít s Premium"
                      }
                      onSelect={() => handleSubscriptionSelect("premium")}
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
              <div className="container max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <FAQ />
              </div>
            </section>

            {/* Signup Section */}
            <section
              id="signup-section"
              className="py-16 sm:py-20 md:py-28 lg:py-32 relative overflow-hidden"
            >
              <div className="container max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="flex flex-col lg:flex-row gap-10 sm:gap-12 lg:gap-16 items-center justify-center">
                  <div className="flex-1 max-w-lg space-y-5 sm:space-y-6 text-center lg:text-left">
                    <motion.h2
                      className="text-2xl sm:text-3xl md:text-4xl font-bold"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                    >
                      Začněte s přípravou na maturitu ještě dnes!
                    </motion.h2>
                    <motion.p
                      className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      Vytvořte si účet zdarma a získejte náskok v přípravě na
                      maturitu z češtiny.
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
