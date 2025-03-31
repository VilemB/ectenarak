"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Languages,
  User,
  AlignJustify,
  BookOpen,
  RotateCcw,
  History,
  Award,
  Bookmark,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface AuthorSummaryPreferences {
  style: "academic" | "casual" | "creative";
  length: "short" | "medium" | "long";
  focus: "life" | "works" | "impact" | "balanced";
  language: "cs" | "en";
  includeTimeline: boolean;
  includeAwards: boolean;
  includeInfluences: boolean;
  studyGuide: boolean;
}

export interface AuthorSummaryPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (preferences: AuthorSummaryPreferences) => Promise<void>;
  isGenerating: boolean;
  title?: string;
  description?: string;
  authorSummaryExists?: boolean;
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

// Tooltip descriptions
const tooltipDescriptions = {
  style: {
    academic: "Formální, odborný styl s literárněvědnou terminologií.",
    casual: "Přístupný, konverzační styl pro běžné čtenáře.",
    creative: "Živý, poutavý styl s důrazem na zajímavosti a příběhy.",
  },
  length: {
    short: "Stručné shrnutí základních informací (cca 150 slov).",
    medium: "Vyvážené shrnutí s klíčovými detaily (cca 300 slov).",
    long: "Podrobné shrnutí s rozšířenými informacemi (cca 500 slov).",
  },
  focus: {
    life: "Zaměření na životní příběh, osobní život a klíčové momenty.",
    works: "Zaměření na literární díla, styl psaní a témata.",
    impact: "Zaměření na vliv autora na literaturu a společnost.",
    balanced: "Vyvážené pokrytí života, děl i významu autora.",
  },
  language: {
    cs: "Shrnutí bude v českém jazyce.",
    en: "Shrnutí bude v anglickém jazyce.",
  },
  includeTimeline:
    "Přidá chronologický přehled klíčových událostí v životě autora.",
  includeAwards: "Zahrne významná ocenění a uznání, která autor získal.",
  includeInfluences:
    "Přidá informace o literárních vlivech a autorech, kteří jej inspirovali.",
};

export function AuthorSummaryPreferencesModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  title,
  description,
  authorSummaryExists = false,
}: AuthorSummaryPreferencesModalProps) {
  const defaultPreferences: AuthorSummaryPreferences = {
    style: "academic",
    length: "medium",
    focus: "balanced",
    language: "cs",
    includeTimeline: false,
    includeAwards: false,
    includeInfluences: false,
    studyGuide: false,
  };

  const [preferences, setPreferences] =
    useState<AuthorSummaryPreferences>(defaultPreferences);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [showLongWarning, setShowLongWarning] = useState(false);

  // Show warning when "long" length is selected
  useEffect(() => {
    setShowLongWarning(preferences.length === "long");
  }, [preferences.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with preferences:", preferences);
    console.log("Is onGenerate defined?", typeof onGenerate === "function");
    console.log("Starting author summary generation...");

    // Call the onGenerate function and catch any errors
    try {
      onGenerate(preferences).catch((error) => {
        console.error("Error in onGenerate promise:", error);
      });
    } catch (error) {
      console.error("Error calling onGenerate:", error);
    }

    console.log("onGenerate function called");
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
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
      preferences.focus === "life"
        ? "život autora"
        : preferences.focus === "works"
        ? "díla autora"
        : preferences.focus === "impact"
        ? "vliv a význam autora"
        : "vyvážený obsah";

    const language = preferences.language === "cs" ? "češtině" : "angličtině";

    let previewText = `Informace o autorovi budou v ${style} stylu, ${length}, zaměřené na ${focus}, v ${language}.`;

    if (preferences.includeTimeline) {
      previewText += " Obsahuje časovou osu života.";
    }

    if (preferences.includeAwards) {
      previewText += " Zahrnuje získaná ocenění.";
    }

    if (preferences.includeInfluences) {
      previewText += " Uvádí literární vlivy a inspirace.";
    }

    return previewText;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || "Generovat informace o autorovi"}
      showCloseButton={true}
    >
      <div className="p-5 max-w-full overflow-x-hidden">
        {description && (
          <p className="text-muted-foreground mb-4">{description}</p>
        )}

        <form onSubmit={handleSubmit}>
          {/* Header with AI icon */}
          <div className="flex items-center mb-4 text-blue-400">
            <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
            <h3 className="text-lg font-medium">
              Přizpůsobte si generování informací o autorovi
            </h3>
          </div>

          {/* Preview section */}
          <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-4 mb-6">
            <div className="flex items-center text-blue-400 mb-2">
              <User className="h-4 w-4 mr-2" />
              <h4 className="font-medium text-sm">Náhled nastavení</h4>
            </div>
            <p className="text-sm text-blue-300/80">{getPreviewText()}</p>
          </div>

          {/* Warning for long summaries */}
          <AnimatePresence>
            {showLongWarning && (
              <div className="mt-2 text-xs flex items-start gap-1.5 text-blue-400 mb-6">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <p>
                  Dlouhé shrnutí vyžaduje více tokenů a může trvat déle. Pro
                  nejlepší výsledky zvažte kratší délku, pokud nepotřebujete
                  podrobné informace.
                </p>
              </div>
            )}
          </AnimatePresence>

          <div className="space-y-5">
            {/* Style selection */}
            <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <label className="text-sm font-medium text-foreground">
                    Styl
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
                  <span className="sr-only">Informace o stylu</span>
                </Button>
              </div>

              <AnimatePresence>
                {activeTooltip === "style" && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mb-3 text-xs bg-secondary p-2 rounded-md text-muted-foreground"
                  >
                    <p>
                      <strong>Akademický:</strong>{" "}
                      {tooltipDescriptions.style.academic}
                    </p>
                    <p>
                      <strong>Neformální:</strong>{" "}
                      {tooltipDescriptions.style.casual}
                    </p>
                    <p>
                      <strong>Kreativní:</strong>{" "}
                      {tooltipDescriptions.style.creative}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-3 gap-3">
                {(["academic", "casual", "creative"] as const).map((style) => (
                  <motion.div
                    key={style}
                    variants={optionVariants}
                    animate={
                      preferences.style === style ? "selected" : "notSelected"
                    }
                  >
                    <Button
                      type="button"
                      variant={
                        preferences.style === style ? "default" : "outline"
                      }
                      className={`w-full ${
                        preferences.style === style
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "border-input text-foreground hover:bg-secondary"
                      }`}
                      onClick={() => setPreferences({ ...preferences, style })}
                    >
                      {style === "academic"
                        ? "Akademický"
                        : style === "casual"
                        ? "Neformální"
                        : "Kreativní"}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Length selection */}
            <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlignJustify className="h-4 w-4 text-blue-500" />
                  <label className="text-sm font-medium text-foreground">
                    Délka
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
                  <span className="sr-only">Informace o délce</span>
                </Button>
              </div>

              <AnimatePresence>
                {activeTooltip === "length" && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mb-3 text-xs bg-secondary p-2 rounded-md text-muted-foreground"
                  >
                    <p>
                      <strong>Krátké:</strong>{" "}
                      {tooltipDescriptions.length.short}
                    </p>
                    <p>
                      <strong>Střední:</strong>{" "}
                      {tooltipDescriptions.length.medium}
                    </p>
                    <p>
                      <strong>Dlouhé:</strong> {tooltipDescriptions.length.long}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-3 gap-3">
                {(["short", "medium", "long"] as const).map((length) => (
                  <motion.div
                    key={length}
                    variants={optionVariants}
                    animate={
                      preferences.length === length ? "selected" : "notSelected"
                    }
                  >
                    <Button
                      type="button"
                      variant={
                        preferences.length === length ? "default" : "outline"
                      }
                      className={`w-full ${
                        preferences.length === length
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "border-input text-foreground hover:bg-secondary"
                      }`}
                      onClick={() => setPreferences({ ...preferences, length })}
                    >
                      {length === "short"
                        ? "Krátké"
                        : length === "medium"
                        ? "Střední"
                        : "Dlouhé"}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Focus selection */}
            <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
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
                  <span className="sr-only">Informace o zaměření</span>
                </Button>
              </div>

              <AnimatePresence>
                {activeTooltip === "focus" && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mb-3 text-xs bg-secondary p-2 rounded-md text-muted-foreground"
                  >
                    <p>
                      <strong>Život:</strong> {tooltipDescriptions.focus.life}
                    </p>
                    <p>
                      <strong>Díla:</strong> {tooltipDescriptions.focus.works}
                    </p>
                    <p>
                      <strong>Vliv:</strong> {tooltipDescriptions.focus.impact}
                    </p>
                    <p>
                      <strong>Vyvážené:</strong>{" "}
                      {tooltipDescriptions.focus.balanced}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["life", "works", "impact", "balanced"] as const).map(
                  (focus) => (
                    <motion.div
                      key={focus}
                      variants={optionVariants}
                      animate={
                        preferences.focus === focus ? "selected" : "notSelected"
                      }
                    >
                      <Button
                        type="button"
                        variant={
                          preferences.focus === focus ? "default" : "outline"
                        }
                        className={`w-full ${
                          preferences.focus === focus
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "border-input text-foreground hover:bg-secondary"
                        }`}
                        onClick={() =>
                          setPreferences({ ...preferences, focus })
                        }
                      >
                        {focus === "life"
                          ? "Život"
                          : focus === "works"
                          ? "Díla"
                          : focus === "impact"
                          ? "Vliv"
                          : "Vyvážené"}
                      </Button>
                    </motion.div>
                  )
                )}
              </div>
            </div>

            {/* Language selection */}
            <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-blue-500" />
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
                  <span className="sr-only">Informace o jazyce</span>
                </Button>
              </div>

              <AnimatePresence>
                {activeTooltip === "language" && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mb-3 text-xs bg-secondary p-2 rounded-md text-muted-foreground"
                  >
                    <p>
                      <strong>Čeština:</strong>{" "}
                      {tooltipDescriptions.language.cs}
                    </p>
                    <p>
                      <strong>Angličtina:</strong>{" "}
                      {tooltipDescriptions.language.en}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-3">
                {(["cs", "en"] as const).map((language) => (
                  <motion.div
                    key={language}
                    variants={optionVariants}
                    animate={
                      preferences.language === language
                        ? "selected"
                        : "notSelected"
                    }
                  >
                    <Button
                      type="button"
                      variant={
                        preferences.language === language
                          ? "default"
                          : "outline"
                      }
                      className={`w-full ${
                        preferences.language === language
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "border-input text-foreground hover:bg-secondary"
                      }`}
                      onClick={() =>
                        setPreferences({ ...preferences, language })
                      }
                    >
                      {language === "cs" ? "Čeština" : "Angličtina"}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Additional options */}
            <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-blue-500" />
                  <label className="text-sm font-medium text-foreground">
                    Další možnosti
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <motion.button
                  type="button"
                  variants={optionVariants}
                  animate={
                    preferences.includeTimeline ? "selected" : "notSelected"
                  }
                  className={`
                    relative p-3 rounded-lg border cursor-pointer transition-all w-full text-left
                    ${
                      preferences.includeTimeline
                        ? "border-blue-500/30 bg-blue-500/10"
                        : "border-border/60 bg-background hover:border-blue-500/30 hover:bg-blue-500/5"
                    }
                  `}
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      includeTimeline: !preferences.includeTimeline,
                    })
                  }
                >
                  <div className="flex items-center">
                    <History className="h-4 w-4 mr-2 text-blue-500" />
                    <div className="text-sm font-medium">Časová osa</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Přidá chronologický přehled života a díla autora.
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  variants={optionVariants}
                  animate={
                    preferences.includeAwards ? "selected" : "notSelected"
                  }
                  className={`
                    relative p-3 rounded-lg border cursor-pointer transition-all w-full text-left
                    ${
                      preferences.includeAwards
                        ? "border-blue-500/30 bg-blue-500/10"
                        : "border-border/60 bg-background hover:border-blue-500/30 hover:bg-blue-500/5"
                    }
                  `}
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      includeAwards: !preferences.includeAwards,
                    })
                  }
                >
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-2 text-blue-500" />
                    <div className="text-sm font-medium">Ocenění</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Zahrne informace o literárních cenách a uznáních.
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  variants={optionVariants}
                  animate={
                    preferences.includeInfluences ? "selected" : "notSelected"
                  }
                  className={`
                    relative p-3 rounded-lg border cursor-pointer transition-all w-full text-left
                    ${
                      preferences.includeInfluences
                        ? "border-blue-500/30 bg-blue-500/10"
                        : "border-border/60 bg-background hover:border-blue-500/30 hover:bg-blue-500/5"
                    }
                  `}
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      includeInfluences: !preferences.includeInfluences,
                    })
                  }
                >
                  <div className="flex items-center">
                    <Bookmark className="h-4 w-4 mr-2 text-blue-500" />
                    <div className="text-sm font-medium">Vlivy a inspirace</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Přidá informace o literárních vlivech a inspiracích autora.
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  variants={optionVariants}
                  animate={preferences.studyGuide ? "selected" : "notSelected"}
                  className={`
                    relative p-3 rounded-lg border cursor-pointer transition-all w-full text-left
                    ${
                      preferences.studyGuide
                        ? "border-blue-500/30 bg-blue-500/10"
                        : "border-border/60 bg-background hover:border-blue-500/30 hover:bg-blue-500/5"
                    }
                  `}
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      studyGuide: !preferences.studyGuide,
                    })
                  }
                >
                  <div className="flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                    <div className="text-sm font-medium">Studijní průvodce</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Vytvoří komplexní studijní materiál s klíčovými body pro
                    zkoušky a tipy pro analýzu.
                  </div>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 pt-4 border-t border-border/50 mt-6">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-muted-foreground hover:text-muted-foreground/80"
                onClick={resetToDefaults}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">Obnovit výchozí</span>
                <span className="sm:hidden">Obnovit</span>
              </Button>
              <AnimatePresence>
                {showSavedMessage && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-green-500"
                  >
                    Nastavení obnoveno
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Generate/Update button */}
            <Button
              type="submit"
              disabled={isGenerating}
              onClick={handleSubmit}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generuji...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {authorSummaryExists ? "Aktualizovat" : "Generovat"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
