import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Podmínky použití | Čtenářský deník",
  description:
    "Podmínky použití služby Čtenářský deník. Seznamte se s pravidly používání naší aplikace pro správu čtenářského deníku.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-orange-500 mb-4">
            Podmínky použití
          </h1>
          <p className="text-muted-foreground">
            Seznamte se s pravidly používání naší služby
          </p>
        </div>

        <div className="space-y-6 bg-card rounded-lg p-6 shadow-sm">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-orange-500">1. Úvod</h2>
            <p className="text-card-foreground">
              Vítejte na Čtenářském deníku. Tyto podmínky použití upravují váš
              přístup a používání naší webové aplikace. Používáním našich služeb
              souhlasíte s těmito podmínkami.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-orange-500">
              2. Používání služby
            </h2>
            <p className="text-card-foreground">
              Čtenářský deník je nástroj pro vytváření a správu digitálního
              čtenářského deníku s využitím umělé inteligence. Službu můžete
              používat pouze v souladu s těmito podmínkami a platnými zákony.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-orange-500">
              3. Účet uživatele
            </h2>
            <p className="text-card-foreground">
              Pro využívání služby je nutné vytvořit si uživatelský účet. Jste
              odpovědní za zachování důvěrnosti vašeho účtu a hesla a za omezení
              přístupu k vašemu účtu.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-orange-500">
              4. Obsah a autorská práva
            </h2>
            <p className="text-card-foreground">
              Veškerý obsah vytvořený pomocí naší služby zůstává vaším
              vlastnictvím. Poskytujete nám však licenci k jeho využití pro
              účely poskytování služby.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-orange-500">
              5. AI funkce
            </h2>
            <p className="text-card-foreground">
              Naše služba využívá umělou inteligenci pro generování shrnutí a
              analýz. Výstupy AI jsou pomocným nástrojem a nenahrazují vlastní
              četbu a interpretaci děl.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-orange-500">
              6. Omezení odpovědnosti
            </h2>
            <p className="text-card-foreground">
              Službu poskytujeme &quot;tak jak je&quot;. Neneseme odpovědnost za
              přesnost AI generovaného obsahu nebo za jakékoli škody vzniklé
              používáním služby.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-orange-500">
              7. Změny podmínek
            </h2>
            <p className="text-card-foreground">
              Vyhrazujeme si právo tyto podmínky kdykoli změnit. O významných
              změnách vás budeme informovat. Pokračováním v používání služby po
              změnách vyjadřujete souhlas s novými podmínkami.
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
