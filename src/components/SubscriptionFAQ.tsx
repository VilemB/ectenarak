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
      "V současné době není možné přímo přejít mezi tarify. Pokud chcete změnit svůj tarif (např. z Basic na Premium nebo naopak), musíte nejprve zrušit své stávající předplatné ve správě účtu. Po vypršení stávajícího období si budete moci zakoupit nový požadovaný tarif.",
  },
  {
    question: "Kdy se obnoví moje AI kredity?",
    answer:
      "AI kredity se obnovují automaticky vždy prvního dne v kalendářním měsíci, bez ohledu na datum zahájení vašeho předplatného. Nevyužité kredity z předchozího měsíce se nepřevádějí.",
  },
  {
    question: "Mohu zrušit předplatné?",
    answer:
      "Ano, předplatné můžete zrušit kdykoliv ve správě účtu. Po zrušení budete mít přístup k placeným funkcím do konce aktuálního zúčtovacího období. Poté se váš účet automaticky převede na bezplatnou verzi.",
  },
  {
    question: "Jaké platební metody přijímáte?",
    answer:
      "Platby jsou bezpečně zpracovávány prostřednictvím služby Stripe. Přijímáme všechny běžné platební metody, které Stripe v našem regionu podporuje, včetně většiny platebních karet a digitálních peněženek. Konkrétní dostupné možnosti uvidíte při placení.",
  },
  {
    question:
      "Co se stane s mými poznámkami a knihami, když přejdu na bezplatný tarif?",
    answer:
      "Vaše existující poznámky zůstanou zachovány. Pokud však počet vašich knih přesahuje limit bezplatného tarifu (aktuálně 3), nebudete moci přidávat nové knihy, dokud jejich počet nesnížíte. Přijdete také o přístup k prémiovým funkcím jako export do PDF a pokročilé nastavení AI.",
  },
  {
    question: "Nabízíte slevy pro školy nebo větší skupiny studentů?",
    answer:
      "V současné době standardní hromadné slevy nenabízíme, ale pokud máte zájem o licenci pro celou třídu nebo školu, kontaktujte nás prosím individuálně.",
  },
  {
    question: "Můžu si AI kredity dokoupit, pokud mi dojdou?",
    answer:
      "Momentálně není možné dokoupit jednotlivé AI kredity. Pokud potřebujete více kreditů pravidelně, doporučujeme zvážit přechod na vyšší tarif (Basic nebo Premium), který obsahuje větší měsíční příděl.",
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
          <motion.div
            key={index}
            className="border-b border-border/40 last:border-b-0"
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
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
          </motion.div>
        ))}
      </div>
    </div>
  );
}
