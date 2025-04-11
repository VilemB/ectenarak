import React from "react";
import { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Kontakt | Čtenářský deník",
  description:
    "Kontaktujte nás s vašimi dotazy ohledně Čtenářského deníku. Jsme tu pro vás.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-orange-500 mb-4">
            Kontaktujte nás
          </h1>
          <p className="text-muted-foreground">
            Jsme tu pro vás s jakýmkoliv dotazem
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="bg-card rounded-lg p-6 shadow-sm space-y-6">
            <h2 className="text-2xl font-semibold text-orange-500">
              Kontaktní informace
            </h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="w-6 h-6 text-orange-500 mt-1" />
                <div>
                  <p className="font-medium text-card-foreground">E-mail</p>
                  <a
                    href="mailto:info@ctenarsky-denik.cz"
                    className="text-orange-500 hover:text-orange-600"
                  >
                    info@ctenarsky-denik.cz
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-6 h-6 text-orange-500 mt-1" />
                <div>
                  <p className="font-medium text-card-foreground">Telefon</p>
                  <a
                    href="tel:+420777888999"
                    className="text-orange-500 hover:text-orange-600"
                  >
                    +420 777 888 999
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-6 h-6 text-orange-500 mt-1" />
                <div>
                  <p className="font-medium text-card-foreground">Adresa</p>
                  <p className="text-muted-foreground">
                    Čtenářská 123
                    <br />
                    110 00 Praha 1<br />
                    Česká republika
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium text-card-foreground mb-2">
                Provozní doba podpory
              </h3>
              <p className="text-muted-foreground">
                Pondělí - Pátek: 9:00 - 17:00
                <br />O víkendech odpovídáme na e-maily.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-orange-500 mb-6">
              Napište nám
            </h2>

            <form className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-card-foreground mb-1"
                >
                  Jméno
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-4 py-2 bg-muted border border-input rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-card-foreground mb-1"
                >
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-4 py-2 bg-muted border border-input rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-card-foreground mb-1"
                >
                  Předmět
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="w-full px-4 py-2 bg-muted border border-input rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-card-foreground mb-1"
                >
                  Zpráva
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="w-full px-4 py-2 bg-muted border border-input rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors"
              >
                Odeslat zprávu
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-orange-500 mb-6">
            Často kladené dotazy
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium text-card-foreground mb-2">
                Jak dlouho trvá odpověď na dotaz?
              </h3>
              <p className="text-muted-foreground">
                Na všechny dotazy se snažíme odpovědět do 24 hodin v pracovních
                dnech.
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium text-card-foreground mb-2">
                Máte technické problémy?
              </h3>
              <p className="text-muted-foreground">
                Pro technickou podporu prosím použijte e-mail{" "}
                <a
                  href="mailto:support@ctenarsky-denik.cz"
                  className="text-orange-500 hover:text-orange-600"
                >
                  support@ctenarsky-denik.cz
                </a>
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium text-card-foreground mb-2">
                Chcete nahlásit chybu?
              </h3>
              <p className="text-muted-foreground">
                Využijte formulář výše a v předmětu uveďte "Nahlášení chyby".
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
