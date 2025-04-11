"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const subscriptionFaqs = [
  {
    question: "Co jsou AI kredity?",
    answer:
      "AI kredity jsou využívány pro generování obsahu pomocí umělé inteligence. Každé použití AI funkcí (jako je generování shrnutí knih nebo informací o autorech) spotřebuje jeden kredit. Kredity se obnovují každý měsíc podle vašeho předplatného.",
  },
  {
    question: "Jak mohu změnit své předplatné?",
    answer:
      'Jednoduše vyberte požadovaný plán výše a klikněte na "Vybrat plán". Změna bude provedena okamžitě a nové funkce budou ihned dostupné. Při snížení úrovně předplatného můžete ztratit přístup k některým funkcím a datům.',
  },
  {
    question: "Kdy se obnoví moje AI kredity?",
    answer:
      "AI kredity se obnovují automaticky na začátku každého předplatného cyklu. Nevyužité kredity z předchozího období se nepřenášejí do následujícího cyklu.",
  },
  {
    question: "Mohu zrušit předplatné?",
    answer:
      "Ano, předplatné můžete zrušit kdykoliv. Po zrušení budete mít přístup k placeným funkcím do konce aktuálního zúčtovacího období. Poté se váš účet automaticky převede na bezplatnou verzi.",
  },
  {
    question: "Jaké platební metody přijímáte?",
    answer:
      "Přijímáme platební karty (Visa, Mastercard) a digitální peněženky (Apple Pay, Google Pay). Platby jsou zpracovávány bezpečně přes Stripe, což znamená, že vaše platební údaje jsou vždy šifrované a nikdy nejsou uloženy na našich serverech.",
  },
];

export default function SubscriptionFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-16 sm:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Často kladené otázky
        </h2>
        <p className="text-muted-foreground text-lg">
          Vše, co potřebujete vědět o předplatném
        </p>
      </div>

      <div className="space-y-2">
        {subscriptionFaqs.map((faq, index) => (
          <div
            key={index}
            className="border-b border-border/40 last:border-b-0"
          >
            <button
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span className="text-lg font-medium">{faq.question}</span>
              <motion.div
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-5 w-5 text-amber-500" />
              </motion.div>
            </button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 text-muted-foreground whitespace-pre-line">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
