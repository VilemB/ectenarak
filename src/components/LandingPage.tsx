"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  ArrowRight,
  BookText,
  PenLine,
  Sparkles,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginForm from "./LoginForm";
import { useState, useEffect } from "react";
import Footer from "./Footer";

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

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
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-30 animate-pulse"></div>
        <div
          className="absolute bottom-40 right-20 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] opacity-20 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Landing page navbar - fixed position */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/40 transition-all duration-300"
        style={{
          boxShadow: scrollY > 10 ? "0 4px 20px rgba(0, 0, 0, 0.1)" : "none",
          padding: scrollY > 10 ? "0.5rem 0" : "1rem 0",
        }}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Čtenářský deník</span>
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
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Hero Content */}
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  Sledujte své{" "}
                  <span className="text-primary relative inline-block">
                    čtenářské úkoly
                    <span className="absolute -bottom-2 left-0 right-0 h-1 bg-primary/50 rounded-full"></span>
                  </span>{" "}
                  jednoduše
                </h1>
                <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
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
                    <ChevronDown className="h-6 w-6 text-primary" />
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>

            {/* Hero Image */}
            <motion.div
              className="flex-1 relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-2xl border border-border/50">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 z-10"></div>

                {/* Placeholder for app screenshot - fixed z-index */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm z-20">
                  <BookOpen className="w-20 h-20 text-primary/50 mb-4" />
                  <p className="text-muted-foreground text-center px-4">
                    Zde bude screenshot aplikace
                    <br />
                    <span className="text-sm">
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

              {/* Floating badges */}
              <motion.div
                className="absolute -top-6 -right-6 bg-card shadow-lg rounded-lg p-3 border border-border/50 z-30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium">Chytré poznámky</span>
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-6 -left-6 bg-card shadow-lg rounded-lg p-3 border border-border/50 z-30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <BookText className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">Přehled četby</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features-section"
        className="py-16 md:py-24 lg:py-32 relative"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              className="text-3xl md:text-4xl font-bold"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Funkce navržené pro <span className="text-primary">studenty</span>
            </motion.h2>
            <motion.p
              className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Vše, co potřebujete pro efektivní organizaci povinné četby a
              přípravu do školy
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              className="bg-card border border-border/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <BookText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sledování četby</h3>
              <p className="text-muted-foreground">
                Přehledně uspořádejte své knihy, sledujte pokrok v četbě a mějte
                přehled o všech povinných titulech.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              className="bg-card border border-border/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Chytré poznámky</h3>
              <p className="text-muted-foreground">
                Vytvářejte strukturované poznámky ke knihám, zaznamenávejte
                důležité pasáže a myšlenky pro pozdější studium.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              className="bg-card border border-border/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <PenLine className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Shrnutí děl</h3>
              <p className="text-muted-foreground">
                Zapisujte si shrnutí knih, hlavní postavy a klíčové události pro
                lepší přípravu na testy a zkoušky.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-70"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-12 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold">
                    Pokročilé funkce pro{" "}
                    <span className="text-primary">studenty</span>
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground">
                    Získejte přístup k exkluzivním nástrojům, které vám pomohou
                    s četbou a přípravou do školy.
                  </p>
                </motion.div>

                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Automatické shrnutí</h3>
                      <p className="text-muted-foreground">
                        Získejte pomoc s vytvářením shrnutí děl,
                        charakteristikou postav a analýzou témat.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Exporty a sdílení</h3>
                      <p className="text-muted-foreground">
                        Exportujte své poznámky do PDF nebo sdílejte je se
                        spolužáky pro společnou přípravu.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Neomezené knihy</h3>
                      <p className="text-muted-foreground">
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
                >
                  <Button
                    size="lg"
                    className="transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95"
                    onClick={() => scrollToSection("signup-section")}
                  >
                    Vyzkoušet Premium
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </div>

              <div className="flex-1 relative">
                <motion.div
                  className="relative aspect-square max-w-md mx-auto"
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
                    <BookOpen className="h-20 w-20 text-primary" />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signup Section */}
      <section id="signup-section" className="py-16 md:py-24 lg:py-32 relative">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <motion.h2
                className="text-3xl md:text-4xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Připojte se k{" "}
                <span className="text-primary">čtenářské komunitě</span>
              </motion.h2>
              <motion.p
                className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Vytvořte si účet zdarma a začněte organizovat svou povinnou
                četbu již dnes.
              </motion.p>
            </div>

            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <LoginForm />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Use the Footer component instead of inline footer */}
      <Footer />
    </div>
  );
}
