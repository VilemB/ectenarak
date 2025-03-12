"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import LoginForm from "./LoginForm";
import { useState, useEffect } from "react";
import {
  ChevronDown,
  BookOpen,
  Sparkles,
  BookText,
  ArrowRight,
  PenLine,
  CheckCircle,
} from "lucide-react";

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [yearlyBilling, setYearlyBilling] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-background via-background/95 to-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-30 animate-pulse"></div>
        <div
          className="absolute bottom-40 right-20 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-accent/10 rounded-full blur-[120px] opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-primary/5 rounded-full blur-[150px] opacity-20 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Landing page navbar - fixed position */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/40 transition-all duration-300"
        style={{
          boxShadow: scrollY > 10 ? "0 4px 20px rgba(0, 0, 0, 0.1)" : "none",
          padding: scrollY > 10 ? "0.5rem 0" : "0.75rem 0",
        }}
      >
        <div className="container max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-lg sm:text-xl font-bold">
              Čtenářský deník
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="hover:bg-primary/10 transition-all duration-300"
            onClick={() => scrollToSection("signup-section")}
          >
            Přihlásit se
          </Button>
        </div>
      </motion.div>

      {/* Hero Section - added padding-top to account for fixed navbar */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center pt-16">
        <div className="container max-w-7xl mx-auto px-6 sm:px-8 py-8 sm:py-16 md:py-24 lg:py-32 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16">
            {/* Hero Content */}
            <div className="flex-1 space-y-6 sm:space-y-8 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  Sledujte své{" "}
                  <span className="text-primary relative inline-block">
                    čtenářské úkoly
                    <span className="absolute -bottom-2 left-0 right-0 h-1 bg-primary/50 rounded-full"></span>
                  </span>{" "}
                  jednoduše
                </h1>
                <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                  Organizujte povinnou četbu, zapisujte si poznámky a sledujte
                  svůj pokrok v četbě knih zadaných do školy.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Button
                  size="lg"
                  className="transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95"
                  onClick={() => scrollToSection("signup-section")}
                >
                  Začít zdarma
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="transition-all duration-300 hover:shadow-md hover:bg-primary/10 active:scale-95"
                  onClick={() => scrollToSection("features-section")}
                >
                  Prozkoumat funkce
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="pt-4"
              >
                <motion.div
                  className="flex justify-center lg:justify-start items-center text-sm text-muted-foreground cursor-pointer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={() => scrollToSection("features-section")}
                >
                  <span>Posuňte dolů pro více informací</span>
                  <motion.div
                    className="ml-2"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>

            {/* Hero Image - Hide on very small screens, show on small and up */}
            <motion.div
              className="flex-1 relative mt-8 lg:mt-0 max-w-[90%] sm:max-w-[80%] md:max-w-none mx-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-2xl border border-border/50">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 z-10"></div>

                {/* Placeholder for app screenshot - fixed z-index */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm z-20">
                  <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-primary/50 mb-4" />
                  <p className="text-muted-foreground text-center px-4 text-sm sm:text-base">
                    Zde bude screenshot aplikace
                    <br />
                    <span className="text-xs sm:text-sm">
                      (Nahraďte vlastním obrázkem)
                    </span>
                  </p>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-4 left-4 right-4 bottom-4 border border-primary/20 rounded-lg z-10"></div>
                <div className="absolute top-8 left-8 right-8 bottom-8 border border-accent/20 rounded-lg z-10"></div>

                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5 animate-pulse z-5"></div>
              </div>

              {/* Floating badges - hidden on smallest screens */}
              <motion.div
                className="absolute -top-4 sm:-top-6 -right-4 sm:-right-6 bg-card shadow-lg rounded-lg p-2 sm:p-3 border border-border/50 z-30 hidden sm:flex"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                  <span className="text-xs sm:text-sm font-medium">
                    Chytré poznámky
                  </span>
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 sm:-bottom-6 -left-4 sm:-left-6 bg-card shadow-lg rounded-lg p-2 sm:p-3 border border-border/50 z-30 hidden sm:flex"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <BookText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  <span className="text-xs sm:text-sm font-medium">
                    Přehled četby
                  </span>
                </div>
              </motion.div>
            </motion.div>
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
              className="text-2xl sm:text-3xl md:text-4xl font-bold"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Funkce navržené pro <span className="text-primary">studenty</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <motion.div
              className="bg-card border border-border/50 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-primary/10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-4">
                <BookText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Sledování četby
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Přehledně uspořádejte své knihy, sledujte pokrok v četbě a mějte
                přehled o všech povinných titulech.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              className="bg-card border border-border/50 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-primary/10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Chytré poznámky
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Vytvářejte strukturované poznámky ke knihám, zaznamenávejte
                důležité pasáže a myšlenky pro pozdější studium.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              className="bg-card border border-border/50 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-primary/10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-4">
                <PenLine className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Shrnutí děl
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Zapisujte si shrnutí knih, hlavní postavy a klíčové události pro
                lepší přípravu na testy a zkoušky.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="py-16 sm:py-20 md:py-28 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-70"></div>
        <div className="container max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
          <div className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl p-6 sm:p-8 md:p-12 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-10 sm:gap-12 lg:gap-16 items-center">
              <div className="flex-1 space-y-6 sm:space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                    Pokročilé funkce pro{" "}
                    <span className="text-primary">studenty</span>
                  </h2>
                  <p className="mt-4 sm:mt-5 text-base sm:text-lg text-muted-foreground">
                    Získejte přístup k exkluzivním nástrojům, které vám pomohou
                    s četbou a přípravou do školy.
                  </p>
                </motion.div>

                <motion.div
                  className="space-y-4 sm:space-y-5"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="flex items-start gap-4">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm sm:text-base font-medium">
                        Automatické shrnutí
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Získejte pomoc s vytvářením shrnutí děl,
                        charakteristikou postav a analýzou témat.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm sm:text-base font-medium">
                        Exporty a sdílení
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Exportujte své poznámky do PDF nebo sdílejte je se
                        spolužáky pro společnou přípravu.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm sm:text-base font-medium">
                        Neomezené knihy
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Přidávejte neomezené množství knih a poznámek bez
                        jakýchkoliv limitů.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="pt-4 sm:pt-6"
                >
                  <Button
                    size="lg"
                    className="transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95"
                    onClick={() => scrollToSection("pricing-section")}
                  >
                    Zobrazit cenové plány
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </div>

              <div className="flex-1 relative hidden sm:block mt-8 lg:mt-0">
                <motion.div
                  className="relative aspect-square max-w-[250px] md:max-w-md mx-auto"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full animate-pulse"></div>
                  <div
                    className="absolute inset-8 bg-gradient-to-tr from-primary/30 to-accent/30 rounded-full animate-pulse"
                    style={{ animationDelay: "500ms" }}
                  ></div>
                  <div
                    className="absolute inset-16 bg-gradient-to-bl from-primary/40 to-accent/40 rounded-full animate-pulse"
                    style={{ animationDelay: "1000ms" }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-primary" />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 opacity-50"></div>
        <div className="container max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <motion.h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Co říkají naši <span className="text-primary">uživatelé</span>
            </motion.h2>
            <motion.p
              className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Přečtěte si zkušenosti studentů, kteří používají Čtenářský deník
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Testimonial 1 */}
            <motion.div
              className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="absolute -top-4 -left-4 text-4xl text-primary/20">
                &ldquo;
              </div>
              <div className="absolute -bottom-4 -right-4 text-4xl text-primary/20">
                &rdquo;
              </div>

              <p className="text-sm sm:text-base text-muted-foreground mb-6 relative z-10">
                Díky Premium verzi jsem si výrazně zlepšila známky z literatury.
                AI shrnutí mi pomáhají lépe pochopit díla a jejich kontext.
                Možnost přizpůsobit si styl a délku shrnutí je skvělá funkce!
              </p>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  KN
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">Karolína N.</p>
                  <p className="text-xs text-muted-foreground">
                    Studentka gymnázia
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Testimonial 2 */}
            <motion.div
              className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="absolute -top-4 -left-4 text-4xl text-primary/20">
                &ldquo;
              </div>
              <div className="absolute -bottom-4 -right-4 text-4xl text-primary/20">
                &rdquo;
              </div>

              <p className="text-sm sm:text-base text-muted-foreground mb-6 relative z-10">
                Basic plán mi naprosto vyhovuje. Mám dostatek prostoru pro
                všechny knihy, které čtu, a podrobné informace o autorech mi
                pomáhají lépe pochopit kontext děl. Za tu cenu je to skvělá
                volba pro každého studenta.
              </p>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  JK
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">Jakub K.</p>
                  <p className="text-xs text-muted-foreground">Student SŠ</p>
                </div>
              </div>
            </motion.div>

            {/* Testimonial 3 */}
            <motion.div
              className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="absolute -top-4 -left-4 text-4xl text-primary/20">
                &ldquo;
              </div>
              <div className="absolute -bottom-4 -right-4 text-4xl text-primary/20">
                &rdquo;
              </div>

              <p className="text-sm sm:text-base text-muted-foreground mb-6 relative z-10">
                Konečně mám všechny knihy a poznámky na jednom místě! Podrobné
                informace o autorech mi ušetřily spoustu času při přípravě na
                maturitu. Neomezený počet knih v Premium verzi je přesně to, co
                jsem potřeboval.
              </p>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  TM
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">Tomáš M.</p>
                  <p className="text-xs text-muted-foreground">Student SOŠ</p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="mt-12 sm:mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button
              variant="outline"
              className="bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300"
              onClick={() => scrollToSection("pricing-section")}
            >
              Vyzkoušet Premium
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing-section"
        className="py-16 sm:py-20 md:py-28 lg:py-32 relative"
      >
        <div className="container max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <motion.h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Vyberte si <span className="text-primary">plán</span>, který vám
              vyhovuje
            </motion.h2>
            <motion.p
              className="mt-4 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Flexibilní možnosti pro všechny studenty
            </motion.p>

            {/* Pricing Toggle */}
            <motion.div
              className="flex items-center justify-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center space-x-3 bg-card/50 backdrop-blur-sm p-1 rounded-full border border-border/50">
                <button
                  onClick={() => setYearlyBilling(false)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    !yearlyBilling
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Měsíčně
                </button>
                <button
                  onClick={() => setYearlyBilling(true)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    yearlyBilling
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Ročně <span className="text-xs opacity-80">(-20%)</span>
                </button>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            {/* Free Plan */}
            <motion.div
              className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  Zdarma
                </h3>
                <div className="flex items-baseline mb-5">
                  <span className="text-3xl sm:text-4xl font-bold">0 Kč</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Základní funkce pro organizaci povinné četby
                </p>
                <Button
                  className="w-full mb-6"
                  variant="outline"
                  onClick={() => scrollToSection("signup-section")}
                >
                  Začít zdarma
                </Button>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Až 20 knih v knihovně</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Základní poznámky ke knihám</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Organizace knih podle kategorií
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Základní informace o autorech
                    </span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Basic Plan */}
            <motion.div
              className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Basic</h3>
                <div className="flex items-baseline mb-5">
                  <span className="text-3xl sm:text-4xl font-bold">
                    {yearlyBilling ? "39 Kč" : "49 Kč"}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {yearlyBilling ? "/ měsíc" : "/ měsíc"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Rozšířené funkce pro běžné studenty
                </p>
                <Button
                  className="w-full mb-6"
                  variant="outline"
                  onClick={() => scrollToSection("signup-section")}
                >
                  Vyzkoušet Basic
                </Button>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Až 100 knih v knihovně</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Rozšířené poznámky ke knihám
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Podrobné informace o autorech
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Pokročilé formátování poznámek
                    </span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              className="bg-card border-2 border-primary rounded-xl overflow-hidden shadow-xl relative z-10 transform md:scale-105"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                Nejoblíbenější
              </div>
              <div className="p-6 sm:p-8 pt-10">
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  Premium
                </h3>
                <div className="flex items-baseline mb-5">
                  <span className="text-3xl sm:text-4xl font-bold">
                    {yearlyBilling ? "63 Kč" : "79 Kč"}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {yearlyBilling ? "/ měsíc" : "/ měsíc"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Pokročilé funkce pro náročné studenty
                </p>
                <Button
                  className="w-full mb-6"
                  onClick={() => scrollToSection("signup-section")}
                >
                  Vyzkoušet Premium
                </Button>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Neomezený počet knih</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">AI generovaná shrnutí děl</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Podrobné informace o autorech
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Pokročilé formátování poznámek
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Přizpůsobení AI shrnutí</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Prioritní přístup k novým funkcím
                    </span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="mt-12 sm:mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Všechny plány zahrnují základní funkce pro správu četby.
              Předplatné můžete zrušit kdykoliv.
              {yearlyBilling &&
                " Při ročním předplatném ušetříte 20% oproti měsíční platbě."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 relative">
        <div className="container max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <motion.h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Často kladené <span className="text-primary">otázky</span>
            </motion.h2>
            <motion.p
              className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Odpovědi na nejčastější dotazy o našich službách
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* FAQ Item 1 */}
            <motion.div
              className="bg-card border border-border/50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold mb-3">
                Jak funguje bezplatná verze?
              </h3>
              <p className="text-sm text-muted-foreground">
                Bezplatná verze umožňuje přidat až 20 knih do vaší knihovny,
                vytvářet základní poznámky, organizovat knihy podle kategorií a
                zobrazovat základní informace o autorech. Je ideální pro
                studenty, kteří potřebují organizovat menší množství povinné
                četby.
              </p>
            </motion.div>

            {/* FAQ Item 2 */}
            <motion.div
              className="bg-card border border-border/50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold mb-3">
                Jaký je rozdíl mezi Basic a Premium plánem?
              </h3>
              <p className="text-sm text-muted-foreground">
                Basic plán (49 Kč/měsíc) nabízí až 100 knih, rozšířené poznámky,
                podrobné informace o autorech a pokročilé formátování. Premium
                plán (79 Kč/měsíc) přidává neomezený počet knih, AI generovaná
                shrnutí děl s možností přizpůsobení a prioritní přístup k novým
                funkcím.
              </p>
            </motion.div>

            {/* FAQ Item 3 */}
            <motion.div
              className="bg-card border border-border/50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold mb-3">
                Mohu zrušit předplatné kdykoliv?
              </h3>
              <p className="text-sm text-muted-foreground">
                Ano, předplatné můžete zrušit kdykoliv a budete mít přístup k
                placeným funkcím do konce aktuálního zúčtovacího období. Po jeho
                skončení se váš účet automaticky převede na bezplatnou verzi.
              </p>
            </motion.div>

            {/* FAQ Item 4 */}
            <motion.div
              className="bg-card border border-border/50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold mb-3">
                Jaké jsou výhody ročního předplatného?
              </h3>
              <p className="text-sm text-muted-foreground">
                Při ročním předplatném ušetříte 20% oproti měsíční platbě. Basic
                plán vás vyjde na 39 Kč měsíčně (místo 49 Kč) a Premium plán na
                63 Kč měsíčně (místo 79 Kč). Roční předplatné se platí
                jednorázově na celý rok dopředu.
              </p>
            </motion.div>

            {/* FAQ Item 5 */}
            <motion.div
              className="bg-card border border-border/50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h3 className="text-lg font-semibold mb-3">
                Jak fungují AI generovaná shrnutí?
              </h3>
              <p className="text-sm text-muted-foreground">
                AI shrnutí využívají pokročilé jazykové modely k vytvoření
                strukturovaného shrnutí díla. S Premium plánem si můžete
                přizpůsobit styl, délku a zaměření shrnutí podle vašich potřeb.
                Můžete si vybrat mezi akademickým, neformálním nebo kreativním
                stylem a různými délkami shrnutí.
              </p>
            </motion.div>

            {/* FAQ Item 6 */}
            <motion.div
              className="bg-card border border-border/50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h3 className="text-lg font-semibold mb-3">
                Plánujete přidat další funkce?
              </h3>
              <p className="text-sm text-muted-foreground">
                Ano, neustále pracujeme na vylepšení aplikace. V blízké
                budoucnosti plánujeme přidat export poznámek do PDF, sdílení
                poznámek se spolužáky a další pokročilé funkce. Uživatelé
                Premium plánu získají k těmto funkcím přístup jako první.
              </p>
            </motion.div>
          </div>

          <motion.div
            className="mt-10 sm:mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <p className="text-sm sm:text-base text-muted-foreground">
              Máte další otázky?{" "}
              <span className="text-primary font-medium cursor-pointer hover:underline">
                Kontaktujte nás
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Signup Section */}
      <section
        id="signup-section"
        className="py-16 sm:py-20 md:py-28 lg:py-32 relative"
      >
        <div className="container max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col lg:flex-row gap-10 sm:gap-12 lg:gap-16 items-center">
            <div className="flex-1 space-y-5 sm:space-y-6 text-center lg:text-left">
              <motion.h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Připojte se k{" "}
                <span className="text-primary">čtenářské komunitě</span>
              </motion.h2>
              <motion.p
                className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Vytvořte si účet zdarma a začněte organizovat svou povinnou
                četbu již dnes.
              </motion.p>
            </div>

            <div className="flex-1 w-full mt-8 lg:mt-0">
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
    </div>
  );
}
