"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Loader2,
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
}

export interface AuthorSummaryPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (preferences: AuthorSummaryPreferences) => Promise<void>;
  isGenerating: boolean;
  title?: string;
  description?: string;
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
  hidden: { opacity: 0, y: 10, backdropFilter: "blur(0px)" },
  visible: {
    opacity: 1,
    y: 0,
    backdropFilter: "blur(4px)",
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
    },
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
}: AuthorSummaryPreferencesModalProps) {
  const defaultPreferences: AuthorSummaryPreferences = {
    style: "academic",
    length: "medium",
    focus: "balanced",
    language: "cs",
    includeTimeline: false,
    includeAwards: false,
    includeInfluences: false,
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
    onGenerate(preferences);
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
      title={title || "Informace o autorovi"}
      showCloseButton={true}
    >
      <div className="p-5 max-w-full overflow-x-hidden">
        {description && (
          <p className="text-muted-foreground mb-4">{description}</p>
        )}

        <form onSubmit={handleSubmit}>
          {/* Header with AI icon */}
          <div className="flex items-center mb-4 text-amber-600 dark:text-amber-400">
            <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
            <h3 className="text-lg font-medium">
              Přizpůsobte si AI informace o autorovi
            </h3>
          </div>

          {/* Preview section */}
          <div className="bg-amber-50/30 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-lg p-4 mb-6">
            <div className="flex items-center text-amber-700 dark:text-amber-400 mb-2">
              <User className="h-4 w-4 mr-2" />
              <h4 className="font-medium text-sm">Náhled nastavení</h4>
            </div>
            <p className="text-sm text-amber-800/80 dark:text-amber-300/80">
              {getPreviewText()}
            </p>
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
                  <Info className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-400 mb-1">
                      Upozornění na délku
                    </h4>
                    <p className="text-xs text-amber-300">
                      Dlouhé shrnutí vyžaduje více tokenů a může trvat déle. Pro
                      nejlepší výsledky zvažte kratší délku, pokud nepotřebujete
                      podrobné informace.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Style selection */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-amber-500" />
                Styl
              </label>
              <div className="relative">
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
                <AnimatePresence>
                  {activeTooltip === "style" && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute right-0 z-10 w-64 p-3 rounded-lg shadow-lg bg-background border border-border text-xs"
                    >
                      <h4 className="font-medium mb-1">Styl textu</h4>
                      <p className="text-muted-foreground">
                        Akademický styl je formální a strukturovaný, neformální
                        je konverzační, kreativní je beletristický a poutavý.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["academic", "casual", "creative"] as const).map((style) => (
                <motion.button
                  key={style}
                  type="button"
                  variants={optionVariants}
                  animate={
                    preferences.style === style ? "selected" : "notSelected"
                  }
                  className={`
                    relative p-3 rounded-lg border cursor-pointer transition-all
                    ${
                      preferences.style === style
                        ? "border-amber-500/50 bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/10"
                        : "border-border/60 bg-background hover:border-amber-500/30 hover:bg-amber-500/5"
                    }
                  `}
                  onClick={() => setPreferences({ ...preferences, style })}
                >
                  <div className="text-xs font-medium">
                    {style === "academic"
                      ? "Akademický"
                      : style === "casual"
                      ? "Neformální"
                      : "Kreativní"}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Length selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground flex items-center">
                <AlignJustify className="h-4 w-4 mr-2 text-amber-500" />
                Délka
              </label>
              <div className="relative">
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
                <AnimatePresence>
                  {activeTooltip === "length" && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={tooltipVariants}
                      className="absolute right-0 top-8 w-64 p-3 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg z-50"
                    >
                      <h4 className="text-xs font-semibold text-white mb-2">
                        Délka shrnutí
                      </h4>
                      <ul className="text-xs text-gray-300 space-y-2">
                        <li>
                          <span className="font-medium text-white">
                            Krátké:
                          </span>{" "}
                          {tooltipDescriptions.length.short}
                        </li>
                        <li>
                          <span className="font-medium text-white">
                            Střední:
                          </span>{" "}
                          {tooltipDescriptions.length.medium}
                        </li>
                        <li>
                          <span className="font-medium text-white">
                            Dlouhé:
                          </span>{" "}
                          {tooltipDescriptions.length.long}
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["short", "medium", "long"] as const).map((length) => (
                <motion.button
                  key={length}
                  type="button"
                  variants={optionVariants}
                  animate={
                    preferences.length === length ? "selected" : "notSelected"
                  }
                  className={`
                    relative p-3 rounded-lg border cursor-pointer transition-all
                    ${
                      preferences.length === length
                        ? "border-amber-500/50 bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/10"
                        : "border-border/60 bg-background hover:border-amber-500/30 hover:bg-amber-500/5"
                    }
                  `}
                  onClick={() => setPreferences({ ...preferences, length })}
                >
                  <div className="text-xs font-medium">
                    {length === "short"
                      ? "Krátké"
                      : length === "medium"
                      ? "Střední"
                      : "Dlouhé"}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Focus selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground flex items-center">
                <User className="h-4 w-4 mr-2 text-amber-500" />
                Zaměření
              </label>
              <div className="relative">
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
                <AnimatePresence>
                  {activeTooltip === "focus" && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={tooltipVariants}
                      className="absolute right-0 top-8 w-64 p-3 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg z-50"
                    >
                      <h4 className="text-xs font-semibold text-white mb-2">
                        Zaměření shrnutí
                      </h4>
                      <ul className="text-xs text-gray-300 space-y-2">
                        <li>
                          <span className="font-medium text-white">Život:</span>{" "}
                          {tooltipDescriptions.focus.life}
                        </li>
                        <li>
                          <span className="font-medium text-white">Díla:</span>{" "}
                          {tooltipDescriptions.focus.works}
                        </li>
                        <li>
                          <span className="font-medium text-white">Vliv:</span>{" "}
                          {tooltipDescriptions.focus.impact}
                        </li>
                        <li>
                          <span className="font-medium text-white">
                            Vyvážené:
                          </span>{" "}
                          {tooltipDescriptions.focus.balanced}
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(["life", "works", "impact", "balanced"] as const).map(
                (focus) => (
                  <motion.button
                    key={focus}
                    type="button"
                    variants={optionVariants}
                    animate={
                      preferences.focus === focus ? "selected" : "notSelected"
                    }
                    className={`
                      relative p-3 rounded-lg border cursor-pointer transition-all
                      ${
                        preferences.focus === focus
                          ? "border-amber-500/50 bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/10"
                          : "border-border/60 bg-background hover:border-amber-500/30 hover:bg-amber-500/5"
                      }
                    `}
                    onClick={() => setPreferences({ ...preferences, focus })}
                  >
                    <div className="text-xs font-medium">
                      {focus === "life"
                        ? "Život"
                        : focus === "works"
                        ? "Díla"
                        : focus === "impact"
                        ? "Vliv"
                        : "Vyvážené"}
                    </div>
                  </motion.button>
                )
              )}
            </div>
          </div>

          {/* Language selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground flex items-center">
                <Languages className="h-4 w-4 mr-2 text-amber-500" />
                Jazyk
              </label>
              <div className="relative">
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
                <AnimatePresence>
                  {activeTooltip === "language" && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={tooltipVariants}
                      className="absolute right-0 top-8 w-64 p-3 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg z-50"
                    >
                      <h4 className="text-xs font-semibold text-white mb-2">
                        Jazyk shrnutí
                      </h4>
                      <ul className="text-xs text-gray-300 space-y-2">
                        <li>
                          <span className="font-medium text-white">
                            Čeština:
                          </span>{" "}
                          {tooltipDescriptions.language.cs}
                        </li>
                        <li>
                          <span className="font-medium text-white">
                            Angličtina:
                          </span>{" "}
                          {tooltipDescriptions.language.en}
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["cs", "en"] as const).map((language) => (
                <motion.button
                  key={language}
                  type="button"
                  variants={optionVariants}
                  animate={
                    preferences.language === language
                      ? "selected"
                      : "notSelected"
                  }
                  className={`
                    relative p-3 rounded-lg border cursor-pointer transition-all
                    ${
                      preferences.language === language
                        ? "border-amber-500/50 bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/10"
                        : "border-border/60 bg-background hover:border-amber-500/30 hover:bg-amber-500/5"
                    }
                  `}
                  onClick={() => setPreferences({ ...preferences, language })}
                >
                  <div className="text-xs font-medium">
                    {language === "cs" ? "Čeština" : "Angličtina"}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Additional options */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center">
              <Bookmark className="h-4 w-4 mr-2 text-amber-500" />
              Další možnosti
            </label>
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
                      ? "border-amber-500/50 bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/10"
                      : "border-border/60 bg-background hover:border-amber-500/30 hover:bg-amber-500/5"
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
                  <History className="h-4 w-4 mr-2 text-amber-500" />
                  <div className="text-sm font-medium">Časová osa</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Přidá chronologický přehled života a díla autora.
                </div>
              </motion.button>

              <motion.button
                type="button"
                variants={optionVariants}
                animate={preferences.includeAwards ? "selected" : "notSelected"}
                className={`
                  relative p-3 rounded-lg border cursor-pointer transition-all w-full text-left
                  ${
                    preferences.includeAwards
                      ? "border-amber-500/50 bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/10"
                      : "border-border/60 bg-background hover:border-amber-500/30 hover:bg-amber-500/5"
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
                  <Award className="h-4 w-4 mr-2 text-amber-500" />
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
                      ? "border-amber-500/50 bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/10"
                      : "border-border/60 bg-background hover:border-amber-500/30 hover:bg-amber-500/5"
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
                  <Bookmark className="h-4 w-4 mr-2 text-amber-500" />
                  <div className="text-sm font-medium">Vlivy a inspirace</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Přidá informace o literárních vlivech a inspiracích autora.
                </div>
              </motion.button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-muted-foreground hover:text-muted-foreground/80"
                onClick={resetToDefaults}
              >
                <RotateCcw className="h-3.5 w-3.5" />
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
            <Button
              type="submit"
              disabled={isGenerating}
              className={`
                flex items-center gap-2 w-full sm:w-auto justify-center 
                bg-amber-500/10 text-amber-500 border border-amber-500/20 
                hover:bg-amber-500/20 transition-all duration-200 
                shadow-sm hover:shadow
                ${isGenerating ? "opacity-70 cursor-not-allowed" : ""}
              `}
              variant="outline"
              size="sm"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  <span>Generuji...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  <span>Generovat info o autorovi</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
