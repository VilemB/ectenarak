"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Loader2,
  Languages,
  BookText,
  AlignJustify,
} from "lucide-react";
import { motion } from "framer-motion";

export interface SummaryPreferences {
  style: "academic" | "casual" | "creative";
  length: "short" | "medium" | "long";
  focus: "plot" | "characters" | "themes" | "balanced";
  language: "cs" | "en";
}

export interface SummaryPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (preferences: SummaryPreferences) => Promise<void>;
  isGenerating: boolean;
}

const optionVariants = {
  selected: {
    scale: 1.02,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
  notSelected: {
    scale: 1,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

export function SummaryPreferencesModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: SummaryPreferencesModalProps) {
  const [preferences, setPreferences] = useState<SummaryPreferences>({
    style: "academic",
    length: "medium",
    focus: "balanced",
    language: "cs",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(preferences);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nastavení shrnutí">
      <div className="p-6 bg-card rounded-b-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <BookText className="h-4 w-4 text-primary" />
                <label className="text-sm font-medium text-foreground">
                  Styl shrnutí
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <motion.div
                  variants={optionVariants}
                  animate={
                    preferences.style === "academic"
                      ? "selected"
                      : "notSelected"
                  }
                >
                  <Button
                    type="button"
                    variant={
                      preferences.style === "academic" ? "default" : "outline"
                    }
                    className={`w-full ${
                      preferences.style === "academic"
                        ? "bg-primary text-primary-foreground"
                        : "border-input text-foreground hover:bg-secondary"
                    }`}
                    onClick={() =>
                      setPreferences({ ...preferences, style: "academic" })
                    }
                  >
                    Akademický
                  </Button>
                </motion.div>
                <motion.div
                  variants={optionVariants}
                  animate={
                    preferences.style === "casual" ? "selected" : "notSelected"
                  }
                >
                  <Button
                    type="button"
                    variant={
                      preferences.style === "casual" ? "default" : "outline"
                    }
                    className={`w-full ${
                      preferences.style === "casual"
                        ? "bg-primary text-primary-foreground"
                        : "border-input text-foreground hover:bg-secondary"
                    }`}
                    onClick={() =>
                      setPreferences({ ...preferences, style: "casual" })
                    }
                  >
                    Neformální
                  </Button>
                </motion.div>
                <motion.div
                  variants={optionVariants}
                  animate={
                    preferences.style === "creative"
                      ? "selected"
                      : "notSelected"
                  }
                >
                  <Button
                    type="button"
                    variant={
                      preferences.style === "creative" ? "default" : "outline"
                    }
                    className={`w-full ${
                      preferences.style === "creative"
                        ? "bg-primary text-primary-foreground"
                        : "border-input text-foreground hover:bg-secondary"
                    }`}
                    onClick={() =>
                      setPreferences({ ...preferences, style: "creative" })
                    }
                  >
                    Kreativní
                  </Button>
                </motion.div>
              </div>
            </div>

            <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlignJustify className="h-4 w-4 text-primary" />
                <label className="text-sm font-medium text-foreground">
                  Délka shrnutí
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <motion.div
                  variants={optionVariants}
                  animate={
                    preferences.length === "short" ? "selected" : "notSelected"
                  }
                >
                  <Button
                    type="button"
                    variant={
                      preferences.length === "short" ? "default" : "outline"
                    }
                    className={`w-full ${
                      preferences.length === "short"
                        ? "bg-primary text-primary-foreground"
                        : "border-input text-foreground hover:bg-secondary"
                    }`}
                    onClick={() =>
                      setPreferences({ ...preferences, length: "short" })
                    }
                  >
                    Krátké
                  </Button>
                </motion.div>
                <motion.div
                  variants={optionVariants}
                  animate={
                    preferences.length === "medium" ? "selected" : "notSelected"
                  }
                >
                  <Button
                    type="button"
                    variant={
                      preferences.length === "medium" ? "default" : "outline"
                    }
                    className={`w-full ${
                      preferences.length === "medium"
                        ? "bg-primary text-primary-foreground"
                        : "border-input text-foreground hover:bg-secondary"
                    }`}
                    onClick={() =>
                      setPreferences({ ...preferences, length: "medium" })
                    }
                  >
                    Střední
                  </Button>
                </motion.div>
                <motion.div
                  variants={optionVariants}
                  animate={
                    preferences.length === "long" ? "selected" : "notSelected"
                  }
                >
                  <Button
                    type="button"
                    variant={
                      preferences.length === "long" ? "default" : "outline"
                    }
                    className={`w-full ${
                      preferences.length === "long"
                        ? "bg-primary text-primary-foreground"
                        : "border-input text-foreground hover:bg-secondary"
                    }`}
                    onClick={() =>
                      setPreferences({ ...preferences, length: "long" })
                    }
                  >
                    Dlouhé
                  </Button>
                </motion.div>
              </div>
            </div>

            <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <label className="text-sm font-medium text-foreground">
                  Zaměření
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <motion.div
                  variants={optionVariants}
                  animate={
                    preferences.focus === "plot" ? "selected" : "notSelected"
                  }
                >
                  <Button
                    type="button"
                    variant={
                      preferences.focus === "plot" ? "default" : "outline"
                    }
                    className={`w-full ${
                      preferences.focus === "plot"
                        ? "bg-primary text-primary-foreground"
                        : "border-input text-foreground hover:bg-secondary"
                    }`}
                    onClick={() =>
                      setPreferences({ ...preferences, focus: "plot" })
                    }
                  >
                    Děj
                  </Button>
                </motion.div>
                <motion.div
                  variants={optionVariants}
                  animate={
                    preferences.focus === "characters"
                      ? "selected"
                      : "notSelected"
                  }
                >
                  <Button
                    type="button"
                    variant={
                      preferences.focus === "characters" ? "default" : "outline"
                    }
                    className={`w-full ${
                      preferences.focus === "characters"
                        ? "bg-primary text-primary-foreground"
                        : "border-input text-foreground hover:bg-secondary"
                    }`}
                    onClick={() =>
                      setPreferences({ ...preferences, focus: "characters" })
                    }
                  >
                    Postavy
                  </Button>
                </motion.div>
                <motion.div
                  variants={optionVariants}
                  animate={
                    preferences.focus === "themes" ? "selected" : "notSelected"
                  }
                >
                  <Button
                    type="button"
                    variant={
                      preferences.focus === "themes" ? "default" : "outline"
                    }
                    className={`w-full ${
                      preferences.focus === "themes"
                        ? "bg-primary text-primary-foreground"
                        : "border-input text-foreground hover:bg-secondary"
                    }`}
                    onClick={() =>
                      setPreferences({ ...preferences, focus: "themes" })
                    }
                  >
                    Témata
                  </Button>
                </motion.div>
                <motion.div
                  variants={optionVariants}
                  animate={
                    preferences.focus === "balanced"
                      ? "selected"
                      : "notSelected"
                  }
                >
                  <Button
                    type="button"
                    variant={
                      preferences.focus === "balanced" ? "default" : "outline"
                    }
                    className={`w-full ${
                      preferences.focus === "balanced"
                        ? "bg-primary text-primary-foreground"
                        : "border-input text-foreground hover:bg-secondary"
                    }`}
                    onClick={() =>
                      setPreferences({ ...preferences, focus: "balanced" })
                    }
                  >
                    Vyvážené
                  </Button>
                </motion.div>
              </div>
            </div>

            <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Languages className="h-4 w-4 text-primary" />
                <label className="text-sm font-medium text-foreground">
                  Jazyk
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  variants={optionVariants}
                  animate={
                    preferences.language === "cs" ? "selected" : "notSelected"
                  }
                >
                  <Button
                    type="button"
                    variant={
                      preferences.language === "cs" ? "default" : "outline"
                    }
                    className={`w-full ${
                      preferences.language === "cs"
                        ? "bg-primary text-primary-foreground"
                        : "border-input text-foreground hover:bg-secondary"
                    }`}
                    onClick={() =>
                      setPreferences({ ...preferences, language: "cs" })
                    }
                  >
                    Čeština
                  </Button>
                </motion.div>
                <motion.div
                  variants={optionVariants}
                  animate={
                    preferences.language === "en" ? "selected" : "notSelected"
                  }
                >
                  <Button
                    type="button"
                    variant={
                      preferences.language === "en" ? "default" : "outline"
                    }
                    className={`w-full ${
                      preferences.language === "en"
                        ? "bg-primary text-primary-foreground"
                        : "border-input text-foreground hover:bg-secondary"
                    }`}
                    onClick={() =>
                      setPreferences({ ...preferences, language: "en" })
                    }
                  >
                    Angličtina
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isGenerating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generuji...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generovat shrnutí
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
