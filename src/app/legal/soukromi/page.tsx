import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zásady ochrany soukromí | Čtenářský deník",
  description:
    "Zásady ochrany osobních údajů a soukromí uživatelů služby Čtenářský deník. Zjistěte, jak chráníme vaše data.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-orange-500 mb-4">
            Zásady ochrany soukromí
          </h1>
          <p className="text-muted-foreground">
            Zjistěte, jak chráníme vaše osobní údaje
          </p>
        </div>

        <div className="space-y-6 bg-card rounded-lg p-6 shadow-sm">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-orange-500">
              1. Shromažďované údaje
            </h2>
            <p className="text-card-foreground">
              Při používání Čtenářského deníku shromažďujeme následující údaje:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-card-foreground">
              <li>Základní údaje z vašeho účtu (e-mail, jméno)</li>
              <li>Vámi vytvořený obsah (záznamy o knihách, poznámky)</li>
              <li>Údaje o používání služby a interakci s AI funkcemi</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-orange-500">
              2. Využití údajů
            </h2>
            <p className="text-card-foreground">Vaše údaje využíváme pro:</p>
            <ul className="list-disc pl-6 space-y-2 text-card-foreground">
              <li>Poskytování a zlepšování našich služeb</li>
              <li>Personalizaci uživatelského zážitku</li>
              <li>Generování AI shrnutí a analýz</li>
              <li>Komunikaci s vámi ohledně služby</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-orange-500">
              3. Ochrana údajů
            </h2>
            <p className="text-card-foreground">
              Vaše údaje chráníme pomocí moderních bezpečnostních technologií.
              Přístup k osobním údajům mají pouze oprávnění pracovníci.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-orange-500">
              4. Sdílení údajů
            </h2>
            <p className="text-card-foreground">
              Vaše osobní údaje nesdílíme s třetími stranami, s výjimkou
              případů:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-card-foreground">
              <li>Kdy je to nutné pro poskytování služby</li>
              <li>Kdy k tomu dáte výslovný souhlas</li>
              <li>Kdy to vyžaduje zákon</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-orange-500">
              5. Vaše práva
            </h2>
            <p className="text-card-foreground">Máte právo:</p>
            <ul className="list-disc pl-6 space-y-2 text-card-foreground">
              <li>Přístup k vašim osobním údajům</li>
              <li>Opravu nepřesných údajů</li>
              <li>Výmaz údajů</li>
              <li>Omezení zpracování</li>
              <li>Přenositelnost údajů</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-orange-500">
              6. Cookies
            </h2>
            <p className="text-card-foreground">
              Používáme cookies pro zlepšení funkčnosti webu a analýzu
              návštěvnosti. Můžete je spravovat v nastavení vašeho prohlížeče.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-orange-500">
              7. Kontakt
            </h2>
            <p className="text-card-foreground">
              S dotazy ohledně ochrany soukromí nás můžete kontaktovat na
              e-mailu:{" "}
              <a
                href="mailto:privacy@ctenarsky-denik.cz"
                className="text-orange-500 hover:text-orange-600"
              >
                privacy@ctenarsky-denik.cz
              </a>
            </p>
          </section>

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Poslední aktualizace: {new Date().toLocaleDateString("cs-CZ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
