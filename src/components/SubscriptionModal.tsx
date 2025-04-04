"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, CreditCard, Info } from "lucide-react";
import Link from "next/link";

// Feature names in Czech
const featureNames: Record<string, string> = {
  aiAuthorSummary: "AI shrnutí autora",
  aiCustomization: "AI shrnutí knihy",
  exportToPdf: "Export do PDF",
  advancedNoteFormat: "Pokročilý formát poznámek",
  detailedAuthorInfo: "Detailní informace o autorovi",
  extendedAiSummary: "Rozšířené AI shrnutí",
};

export default function SubscriptionModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [feature, setFeature] = useState<string>("");
  const [needsCredits, setNeedsCredits] = useState(false);
  const [creditsOnly, setCreditsOnly] = useState(false);

  // Event listener for the show-subscription-modal event
  useEffect(() => {
    const handleShowSubscriptionModal = (event: CustomEvent) => {
      console.log("Subscription modal event received:", event.detail);

      // Extract information from the event detail
      const { feature, needsCredits, creditsOnly } = event.detail;

      // Update state with the extracted information
      setFeature(feature || "");
      setNeedsCredits(needsCredits || false);
      setCreditsOnly(creditsOnly || false);

      // Open the modal
      setIsOpen(true);
    };

    // Add event listener
    window.addEventListener(
      "show-subscription-modal",
      handleShowSubscriptionModal as EventListener
    );

    // Clean up event listener
    return () => {
      window.removeEventListener(
        "show-subscription-modal",
        handleShowSubscriptionModal as EventListener
      );
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        creditsOnly
          ? "Potřebujete více AI kreditů"
          : "Potřebujete vyšší předplatné"
      }
    >
      <div className="space-y-4">
        {/* AI Credits Content */}
        {needsCredits && creditsOnly && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-950/50 rounded-lg border border-blue-800/50">
              <Sparkles className="h-6 w-6 text-orange-400" />
              <div>
                <h3 className="text-sm font-medium text-blue-100">
                  Pro použití {featureNames[feature] || feature} potřebujete AI
                  kredity
                </h3>
                <p className="text-xs text-blue-300">
                  Vaše AI kredity byly vyčerpány. Upgradujte své předplatné pro
                  získání dalších kreditů.
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-950/30 rounded-lg border border-blue-900/30">
              <h3 className="text-base font-medium text-blue-100 mb-2">
                Aktuální stav AI kreditů
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-900/50 p-2 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-blue-200">
                    <strong>
                      {user?.subscription?.aiCreditsRemaining || 0}
                    </strong>{" "}
                    z <strong>{user?.subscription?.aiCreditsTotal || 0}</strong>{" "}
                    kreditů
                  </p>
                  <p className="text-xs text-blue-400">
                    Kredity se obnovují každý měsíc
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-blue-300 flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-400 mt-0.5" />
              <p>
                AI kredity jsou součástí předplatného a umožňují používat AI
                funkce. Upgradujte své předplatné pro získání více kreditů.
              </p>
            </div>

            <div className="pt-2">
              <Link href="/subscription">
                <Button
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400"
                  onClick={handleClose}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Získat více AI kreditů
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Subscription Upgrade Content */}
        {(!needsCredits || !creditsOnly) && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-950/50 rounded-lg border border-blue-800/50">
              <CreditCard className="h-6 w-6 text-blue-400" />
              <div>
                <h3 className="text-sm font-medium text-blue-100">
                  Pro přístup k {featureNames[feature] || feature} potřebujete
                  vyšší předplatné
                </h3>
                <p className="text-xs text-blue-300">
                  Tato funkce je dostupná v rámci Premium nebo Basic
                  předplatného
                </p>
              </div>
            </div>

            <div className="text-sm text-blue-300 flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-400 mt-0.5" />
              <p>
                Upgradujte své předplatné pro odemknutí všech funkcí aplikace,
                včetně neomezeného počtu knih, AI shrnutí a dalších prémiových
                funkcí.
              </p>
            </div>

            <div className="pt-2">
              <Link href="/subscription">
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
                  onClick={handleClose}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Zobrazit plány předplatného
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full border-blue-800/50 text-blue-300 hover:bg-blue-900/30"
            onClick={handleClose}
          >
            Zavřít
          </Button>
        </div>
      </div>
    </Modal>
  );
}
