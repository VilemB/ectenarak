"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  ArrowRight,
  Star,
  BookText,
  PenLine,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginForm from "./LoginForm";

export default function LandingPage() {
  return (
    <div className="w-full bg-gradient-to-b from-background to-background/95">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Hero Content */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-block bg-primary/10 px-4 py-2 rounded-full text-primary font-medium text-sm mb-2"
              >
                Váš osobní čtenářský deník
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                Zaznamenávejte své{" "}
                <span className="text-primary">čtenářské zážitky</span>
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
                  className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
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
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm">
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
              </div>

              {/* Floating badges */}
              <motion.div
                className="absolute -top-4 -right-4 bg-card shadow-lg p-3 rounded-lg border border-border/50 flex items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <div className="text-sm font-medium">Snadné používání</div>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -left-4 bg-card shadow-lg p-3 rounded-lg border border-border/50 flex items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <BookText className="h-5 w-5 text-primary" />
                <div className="text-sm font-medium">Přehledné poznámky</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
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
                className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
              >
                <div className="mb-4 p-3 bg-primary/10 rounded-lg inline-block">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action / Sign Up Section */}
      <section id="signup-section" className="py-20 md:py-28 relative">
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
                  className="p-8 md:p-12 bg-background/50"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <LoginForm />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
