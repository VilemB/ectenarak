"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Loader2,
  Languages,
  BookText,
  AlignJustify,
  Info,
  Save,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "@/hooks/useLocalStorage";

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

const tooltipVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
    },
  },
};

// Descriptions for each option to help users understand what they do
const optionDescriptions = {
  style: {
    academic:
      "Formální styl s důrazem na analýzu a strukturu. Vhodné pro školní práce.",
    casual: "Přátelský, konverzační styl. Snadno čitelný a přístupný.",
    creative: "Barvitý a expresivní styl s důrazem na zajímavé formulace.",
  },
  length: {
    short:
      "Stručné shrnutí (cca 150-200 slov). Nejefektivnější využití tokenů, vhodné pro krátké poznámky.",
    medium:
      "Středně dlouhé shrnutí (cca 300-400 slov). Vyvážený poměr mezi detaily a využitím tokenů.",
    long: "Podrobné shrnutí (cca 500-700 slov). Nejvíce detailů, ale vyžaduje více tokenů a může být zkráceno při velkém množství poznámek.",
  },
  focus: {
    plot: "Zaměření na hlavní dějovou linii a události.",
    characters: "Zaměření na postavy, jejich vývoj a vztahy.",
    themes: "Zaměření na hlavní témata, motivy a poselství díla.",
    balanced: "Vyvážené pokrytí děje, postav i témat.",
  },
  language: {
    cs: "Shrnutí bude vygenerováno v češtině.",
    en: "Shrnutí bude vygenerováno v angličtině.",
  },
};

export function SummaryPreferencesModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: SummaryPreferencesModalProps) {
  // Load saved preferences from localStorage
  const [savedPreferences, setSavedPreferences] =
    useLocalStorage<SummaryPreferences>("summary-preferences", {
      style: "academic",
      length: "medium",
      focus: "balanced",
      language: "cs",
    });

  const [preferences, setPreferences] =
    useState<SummaryPreferences>(savedPreferences);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [showLongWarning, setShowLongWarning] = useState(false);

  // Update preferences when savedPreferences change
  useEffect(() => {
    setPreferences(savedPreferences);
  }, [savedPreferences]);

  // Show warning when "long" length is selected
  useEffect(() => {
    setShowLongWarning(preferences.length === "long");
  }, [preferences.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(preferences);
  };

  const saveAsDefault = () => {
    setSavedPreferences(preferences);
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2000);
  };

  const resetToDefaults = () => {
    const defaults: SummaryPreferences = {
      style: "academic",
      length: "medium",
      focus: "balanced",
      language: "cs",
    };
    setPreferences(defaults);
    setSavedPreferences(defaults);
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2000);
  };

  // Preview text based on current preferences
  const getPreviewText = () => {
    const style =
      preferences.style === "academic"
        ? "akademickém"
        : preferences.style === "casual"
        ? "neformálním"
        : "kreativním";

    const length =
      preferences.length === "short"
        ? "krátké"
        : preferences.length === "medium"
        ? "středně dlouhé"
        : "dlouhé";

    const focus =
      preferences.focus === "plot"
        ? "děj"
        : preferences.focus === "characters"
        ? "postavy"
        : preferences.focus === "themes"
        ? "témata"
        : "vyvážený obsah";

    const language = preferences.language === "cs" ? "češtině" : "angličtině";

    return `Shrnutí bude v ${style} stylu, ${length}, zaměřené na ${focus}, v ${language}.`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nastavení shrnutí">
      <div className="p-6 bg-card rounded-b-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preview section */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-foreground mb-2 flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              Náhled nastavení
            </h3>
            <p className="text-sm text-muted-foreground">{getPreviewText()}</p>
          </div>

          {/* Warning for long summaries */}
          <AnimatePresence>
            {showLongWarning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4"
              >
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground">
                      Upozornění na délku
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Dlouhé shrnutí vyžaduje více tokenů, což může být problém
                      při velkém množství poznámek. Poznámky delší než 6000
                      znaků budou automaticky zkráceny. Pokud bude shrnutí i
                      přesto neúplné, doporučujeme:
                      <ul className="mt-1 ml-4 list-disc space-y-1">
                        <li>Zvolit kratší délku shrnutí</li>
                        <li>Rozdělit poznámky do více knih</li>
                        <li>Ručně zkrátit nejdůležitější poznámky</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-5">
            <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookText className="h-4 w-4 text-primary" />
                  <label className="text-sm font-medium text-foreground">
                    Styl shrnutí
                  </label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-full"
                  onClick={() =>
                    setActiveTooltip(activeTooltip === "style" ? null : "style")
                  }
                >
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>

              <AnimatePresence>
                {activeTooltip === "style" && (
                  <motion.div
                    variants={tooltipVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="mb-3 text-xs bg-secondary p-2 rounded-md text-muted-foreground"
                  >
                    <p>
                      <strong>Akademický:</strong>{" "}
                      {optionDescriptions.style.academic}
                    </p>
                    <p>
                      <strong>Neformální:</strong>{" "}
                      {optionDescriptions.style.casual}
                    </p>
                    <p>
                      <strong>Kreativní:</strong>{" "}
                      {optionDescriptions.style.creative}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlignJustify className="h-4 w-4 text-primary" />
                  <label className="text-sm font-medium text-foreground">
                    Délka shrnutí
                  </label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-full"
                  onClick={() =>
                    setActiveTooltip(
                      activeTooltip === "length" ? null : "length"
                    )
                  }
                >
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>

              <AnimatePresence>
                {activeTooltip === "length" && (
                  <motion.div
                    variants={tooltipVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="mb-3 text-xs bg-secondary p-2 rounded-md text-muted-foreground"
                  >
                    <p>
                      <strong>Krátké:</strong> {optionDescriptions.length.short}
                    </p>
                    <p>
                      <strong>Střední:</strong>{" "}
                      {optionDescriptions.length.medium}
                    </p>
                    <p>
                      <strong>Dlouhé:</strong> {optionDescriptions.length.long}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <label className="text-sm font-medium text-foreground">
                    Zaměření
                  </label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-full"
                  onClick={() =>
                    setActiveTooltip(activeTooltip === "focus" ? null : "focus")
                  }
                >
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>

              <AnimatePresence>
                {activeTooltip === "focus" && (
                  <motion.div
                    variants={tooltipVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="mb-3 text-xs bg-secondary p-2 rounded-md text-muted-foreground"
                  >
                    <p>
                      <strong>Děj:</strong> {optionDescriptions.focus.plot}
                    </p>
                    <p>
                      <strong>Postavy:</strong>{" "}
                      {optionDescriptions.focus.characters}
                    </p>
                    <p>
                      <strong>Témata:</strong> {optionDescriptions.focus.themes}
                    </p>
                    <p>
                      <strong>Vyvážené:</strong>{" "}
                      {optionDescriptions.focus.balanced}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-primary" />
                  <label className="text-sm font-medium text-foreground">
                    Jazyk
                  </label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-full"
                  onClick={() =>
                    setActiveTooltip(
                      activeTooltip === "language" ? null : "language"
                    )
                  }
                >
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>

              <AnimatePresence>
                {activeTooltip === "language" && (
                  <motion.div
                    variants={tooltipVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="mb-3 text-xs bg-secondary p-2 rounded-md text-muted-foreground"
                  >
                    <p>
                      <strong>Čeština:</strong> {optionDescriptions.language.cs}
                    </p>
                    <p>
                      <strong>Angličtina:</strong>{" "}
                      {optionDescriptions.language.en}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

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

          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-muted-foreground rounded-full"
                onClick={saveAsDefault}
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Uložit jako výchozí
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-muted-foreground rounded-full"
                onClick={resetToDefaults}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Obnovit výchozí
              </Button>
              <AnimatePresence>
                {showSavedMessage && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-primary"
                  >
                    Nastavení uloženo!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
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
