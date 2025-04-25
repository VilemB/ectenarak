"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Pro koho je aplikace určena?",
    answer:
      "Aplikace je primárně určena pro:\n\n• Studenty středních škol připravující se na maturitu\n• Žáky, kteří si chtějí systematicky vést zápisky z četby\n• Každého, kdo si chce organizovat své poznámky z knih a mít je přehledně na jednom místě",
  },
  {
    question: "V čem mi aplikace pomůže?",
    answer:
      "Aplikace Čtenářský deník je navržena speciálně pro studenty a jejich přípravu na maturitu. Pomůže vám:\n\n• Systematicky si vést poznámky k povinné četbě\n• Generovat AI shrnutí knih a autorů\n• Exportovat poznámky do PDF pro snadné studium\n• Organizovat si četbu a přípravu na zkoušky\n• Mít všechny materiály přehledně na jednom místě",
  },
  {
    question: "Co získám zakoupením předplatného?",
    answer:
      "S předplatným získáte přístup k pokročilým funkcím:\n\n• Více AI kreditů pro generování shrnutí\n• Neomezený počet knih v knihovně\n• Pokročilé možnosti přizpůsobení AI shrnutí\n• Export poznámek do PDF\n• Prioritní podporu\n• Všechny funkce ze základní verze",
  },
  {
    question: "Existuje také mobilní aplikace?",
    answer:
      "Mobilní aplikace zatím není k dispozici, ale je to v našem plánu. Webová verze je plně responzivní a funguje dobře i na mobilních zařízeních. O vydání mobilní aplikace vás budeme informovat.",
  },
  {
    question: "Mohu zrušit předplatné?",
    answer:
      "Ano, předplatné můžete zrušit kdykoliv. Po zrušení budete mít přístup k placeným funkcím do konce aktuálního zúčtovacího období. Poté se váš účet automaticky převede na bezplatnou verzi.",
  },
  {
    question: "Jak aplikace funguje?",
    answer:
      "Aplikace je navržena tak, aby vám pomohla s přípravou na maturitu z českého jazyka a literatury:\n\n1. Vytvoříte si účet a přihlásíte se\n2. V knihovně si vytvoříte seznam knih z povinné četby\n3. Ke každé knize si můžete:\n   • Psát vlastní poznámky\n   • Generovat AI shrnutí obsahu\n   • Ukládat informace o autorovi\n   • Vytvářet strukturované zápisky\n4. Všechny poznámky si můžete exportovat do PDF pro snadné studium\n5. V nastavení si můžete přizpůsobit vzhled a funkce podle svých potřeb\n\nAplikace je intuitivní a přehledná, takže se rychle naučíte všechny funkce využívat.",
  },
  {
    question: "Jsou mé údaje zabezpečené?",
    answer:
      "Ano, bezpečnost vašich údajů je pro nás prioritou. Všechna data jsou šifrována a ukládána v zabezpečeném prostředí. Nikdy nesdílíme vaše osobní údaje s třetími stranami. Můžete si také kdykoliv stáhnout svá data nebo požádat o jejich smazání.",
  },
  {
    question:
      "Co když potřebuji shrnutí pro knihu nebo autora, který není v běžném maturitním seznamu?",
    answer:
      "Naše AI se snaží pokrýt širokou škálu literatury. Pokud zadáte název díla nebo autora, AI se pokusí vygenerovat relevantní informace. Pro nejlepší výsledky doporučujeme používat přesné názvy.",
  },
  {
    question:
      "Jaký je rozdíl oproti běžnému textovému editoru nebo poznámkové aplikaci?",
    answer:
      "eČtenářák je specializovaný nástroj. Hlavní výhodou je integrace AI pro generování shrnutí děl a autorů přímo v kontextu vašich poznámek, přednastavené struktury pro zápisky a funkce navržené specificky pro potřeby studentů literatury (jako správa knihovny a budoucí specifické funkce).",
  },
  {
    question: "Plánujete přidat další funkce?",
    answer:
      "Ano! Neustále pracujeme na vylepšování eČtenářáku. V blízké budoucnosti se chceme zaměřit například na vylepšené možnosti formátování poznámek a možnost přidávat vlastní tagy ke knihám. Sledujte naše novinky!",
  },
  {
    question: "Co když narazím na problém nebo mám nápad na vylepšení?",
    answer:
      "Vaše zpětná vazba je pro nás důležitá! Pokud máte problém nebo nápad, neváhejte nás kontaktovat prostřednictvím kontaktního formuláře na našem webu.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-16 sm:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Často kladené otázky
        </h2>
        <p className="text-muted-foreground text-lg">
          Vše, co potřebujete vědět o Čtenářském deníku
        </p>
      </div>

      <div className="space-y-2">
        {faqs.map((faq, index) => (
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
