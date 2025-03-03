"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  ArrowRight,
  Star,
  BookText,
  PenLine,
  Sparkles,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginForm from "./LoginForm";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

      {/* Landing page navbar - only shown when not logged in */}
      <motion.div
        className="sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/40 transition-all duration-300"
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
            variant="ghost"
            className="hover:bg-primary/10 transition-all duration-300"
            onClick={() =>
              document
                .getElementById("signup-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Přihlásit se
          </Button>
        </div>
      </motion.div>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Hero Content */}
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-block bg-primary/10 px-4 py-2 rounded-full text-primary font-medium text-sm mb-2"
              >
                Váš osobní čtenářský deník
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                Zaznamenávejte své{" "}
                <span className="text-primary relative">
                  čtenářské zážitky
                  <span className="absolute bottom-2 left-0 w-full h-2 bg-primary/20 rounded-full -z-10"></span>
                </span>
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Sledujte svůj čtenářský pokrok, zapisujte si poznámky a
                objevujte nové knihy. Vše na jednom místě, přístupné odkudkoliv.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-4 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <Button
                  size="lg"
                  className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group bg-primary"
                  onClick={() =>
                    document
                      .getElementById("signup-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Začít zdarma
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  onClick={() =>
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Zjistit více
                </Button>
              </motion.div>

              <motion.div
                className="flex items-center justify-center lg:justify-start gap-2 pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={`avatar-${i}`}
                      className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium"
                    >
                      {i}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">100+</span>{" "}
                  spokojených uživatelů
                </div>
              </motion.div>

              {/* Scroll indicator */}
              <motion.div
                className="hidden lg:flex justify-center lg:justify-start pt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <motion.div
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() =>
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  whileHover={{ y: 5 }}
                >
                  <span className="text-sm text-muted-foreground mb-2">
                    Posunout dolů
                  </span>
                  <motion.div
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

                {/* Placeholder for app screenshot - replace with actual image later */}
                <div className="z-50 absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm">
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
                <div className="absolute top-4 left-4 right-4 bottom-4 border border-primary/20 rounded-lg z-20"></div>
                <div className="absolute top-8 left-8 right-8 bottom-8 border border-accent/20 rounded-lg z-20"></div>

                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5 animate-pulse z-5"></div>
              </div>

              {/* Floating badges */}
              <motion.div
                className="z-50 absolute -top-4 -right-4 bg-card shadow-lg p-3 rounded-lg border border-border/50 flex items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                whileHover={{ y: -5, scale: 1.05 }}
              >
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <div className="text-sm font-medium">Snadné používání</div>
              </motion.div>

              <motion.div
                className="z-50 absolute -bottom-4 -left-4 bg-card shadow-lg p-3 rounded-lg border border-border/50 flex items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                whileHover={{ y: -5, scale: 1.05 }}
              >
                <BookText className="h-5 w-5 text-primary" />
                <div className="text-sm font-medium">Přehledné poznámky</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 relative">
        {/* Subtle divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"></div>

        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block bg-primary/10 px-4 py-2 rounded-full text-primary font-medium text-sm mb-4">
              Funkce
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Proč používat{" "}
              <span className="text-primary">Čtenářský deník</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Objevte všechny výhody, které vám naše aplikace přináší
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <BookText className="h-10 w-10 text-primary" />,
                title: "Sledujte své čtení",
                description:
                  "Zaznamenávejte knihy, které jste přečetli, a udržujte si přehled o svém čtenářském pokroku.",
              },
              {
                icon: <PenLine className="h-10 w-10 text-primary" />,
                title: "Pište poznámky",
                description:
                  "Zapisujte si myšlenky, citáty a dojmy z četby, abyste si je uchovali pro budoucí inspiraci.",
              },
              {
                icon: <Sparkles className="h-10 w-10 text-primary" />,
                title: "Získejte doporučení",
                description:
                  "Objevujte nové knihy na základě vašich čtenářských preferencí a historie.",
              },
            ].map((feature, index) => (
              <motion.div
                key={`feature-${index}`}
                className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-border/50 relative overflow-hidden group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
              >
                {/* Subtle gradient background that animates on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="mb-4 p-3 bg-primary/10 rounded-lg inline-block relative z-10">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 relative z-10">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground relative z-10">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Additional feature highlight */}
          <motion.div
            className="mt-20 bg-card rounded-xl p-8 border border-border/50 shadow-xl overflow-hidden relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] -z-0"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
              <div>
                <div className="inline-block bg-primary/10 px-4 py-2 rounded-full text-primary font-medium text-sm mb-4">
                  Prémiová funkce
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Synchronizace napříč zařízeními
                </h3>
                <p className="text-muted-foreground mb-6">
                  Přistupujte ke svému čtenářskému deníku z jakéhokoliv
                  zařízení. Vaše knihy a poznámky jsou vždy synchronizovány a
                  aktuální.
                </p>

                <ul className="space-y-3">
                  {[
                    "Automatické zálohování dat",
                    "Přístup z mobilu, tabletu i počítače",
                    "Okamžitá synchronizace změn",
                  ].map((item, i) => (
                    <motion.li
                      key={`sync-feature-${i}`}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * i, duration: 0.4 }}
                    >
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="relative h-[300px] rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <BookOpen className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Ilustrace synchronizace
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action / Sign Up Section */}
      <section id="signup-section" className="py-20 md:py-28 relative">
        {/* Subtle divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"></div>

        {/* Background Elements */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-primary/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-accent/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left side - CTA */}
                <motion.div
                  className="p-8 md:p-12 flex flex-col justify-center"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="inline-block bg-primary/10 px-4 py-2 rounded-full text-primary font-medium text-sm mb-4">
                    Začněte ještě dnes
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    Připojte se k nám ještě dnes
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Vytvořte si účet zdarma a začněte sledovat své čtenářské
                    zážitky. Žádné skryté poplatky, žádné omezení.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Neomezený počet knih a poznámek",
                      "Přístup ze všech zařízení",
                      "Bezpečné uložení dat",
                      "Pravidelné aktualizace a nové funkce",
                    ].map((item, i) => (
                      <motion.li
                        key={`benefit-${i}`}
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 * i, duration: 0.4 }}
                      >
                        <div className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <span>{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                {/* Right side - Form */}
                <motion.div
                  className="p-8 md:p-12 bg-background/50 relative"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Subtle glow behind the form */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] -z-0"></div>

                  <div className="relative z-10">
                    <LoginForm />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 relative">
        {/* Subtle divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"></div>

        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-bold">Čtenářský deník</span>
            </div>

            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Čtenářský deník. Všechna práva
              vyhrazena.
            </div>

            <div className="flex gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Podmínky
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Soukromí
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Kontakt
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
