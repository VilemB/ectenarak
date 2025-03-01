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
import { useSummaryPreferences } from "@/contexts/SummaryPreferencesContext";

export interface SummaryPreferences {
  style: "academic" | "casual" | "creative";
  length: "short" | "medium" | "long";
  focus: "plot" | "characters" | "themes" | "balanced";
  language: "cs" | "en";
  examFocus: boolean;
  literaryContext: boolean;
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
  examFocus:
    "Zaměření na aspekty důležité pro maturitní zkoušku z českého jazyka a literatury.",
  literaryContext:
    "Přidá informace o literárním kontextu, období a zařazení díla.",
};

export function SummaryPreferencesModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: SummaryPreferencesModalProps) {
  // Use global preferences instead of local storage directly
  const {
    preferences: globalPreferences,
    setPreferences: setGlobalPreferences,
  } = useSummaryPreferences();

  const [preferences, setPreferences] =
    useState<SummaryPreferences>(globalPreferences);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [showLongWarning, setShowLongWarning] = useState(false);

  // Update local preferences when global preferences change
  useEffect(() => {
    setPreferences(globalPreferences);
  }, [globalPreferences]);

  // Show warning when "long" length is selected
  useEffect(() => {
    setShowLongWarning(preferences.length === "long");
  }, [preferences.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(preferences);
  };

  const saveAsDefault = () => {
    setGlobalPreferences(preferences);
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2000);
  };

  const resetToDefaults = () => {
    const defaults: SummaryPreferences = {
      style: "academic",
      length: "medium",
      focus: "balanced",
      language: "cs",
      examFocus: false,
      literaryContext: false,
    };
    setPreferences(defaults);
    setGlobalPreferences(defaults);
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

    let previewText = `Shrnutí bude v ${style} stylu, ${length}, zaměřené na ${focus}, v ${language}.`;

    if (preferences.examFocus) {
      previewText += " Strukturováno pro maturitní zkoušku.";
    }

    if (preferences.literaryContext) {
      previewText += " Obsahuje literární kontext a zařazení díla.";
    }

    return previewText;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nastavení shrnutí"
      showCloseButton={true}
    >
      <div className="p-5 max-w-full overflow-x-hidden">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preview section */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-white mb-2 flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              Náhled nastavení
            </h3>
            <p className="text-sm text-gray-300">{getPreviewText()}</p>
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
                      Dlouhá shrnutí vyžadují více tokenů a mohou být zkrácena,
                      pokud máte hodně poznámek. Pro nejlepší výsledky zvažte
                      kratší délku nebo rozdělte poznámky do více knih.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Maturita Exam Features */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center">
              <BookText className="h-4 w-4 mr-2 text-primary" />
              Funkce pro maturanty
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="relative">
                <motion.div
                  variants={optionVariants}
                  initial="notSelected"
                  animate={preferences.examFocus ? "selected" : "notSelected"}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    preferences.examFocus
                      ? "bg-primary/10 border-primary/30"
                      : "bg-card border-border hover:bg-secondary/50"
                  }`}
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      examFocus: !preferences.examFocus,
                    })
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                          preferences.examFocus
                            ? "bg-primary border-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {preferences.examFocus && (
                          <div className="w-3 h-3 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">
                          Zaměření na maturitu
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Strukturuje shrnutí podle požadavků maturitní zkoušky
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTooltip(
                          activeTooltip === "examFocus" ? null : "examFocus"
                        );
                      }}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
                <AnimatePresence>
                  {activeTooltip === "examFocus" && (
                    <motion.div
                      variants={tooltipVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="absolute right-0 mt-2 p-3 bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-lg z-10 w-full max-w-md"
                    >
                      <p className="text-xs text-popover-foreground">
                        {optionDescriptions.examFocus}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <motion.div
                  variants={optionVariants}
                  initial="notSelected"
                  animate={
                    preferences.literaryContext ? "selected" : "notSelected"
                  }
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    preferences.literaryContext
                      ? "bg-primary/10 border-primary/30"
                      : "bg-card border-border hover:bg-secondary/50"
                  }`}
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      literaryContext: !preferences.literaryContext,
                    })
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                          preferences.literaryContext
                            ? "bg-primary border-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {preferences.literaryContext && (
                          <div className="w-3 h-3 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">
                          Literární kontext
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Přidá informace o literárním období a zařazení díla
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTooltip(
                          activeTooltip === "literaryContext"
                            ? null
                            : "literaryContext"
                        );
                      }}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
                <AnimatePresence>
                  {activeTooltip === "literaryContext" && (
                    <motion.div
                      variants={tooltipVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="absolute right-0 mt-2 p-3 bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-lg z-10 w-full max-w-md"
                    >
                      <p className="text-xs text-popover-foreground">
                        {optionDescriptions.literaryContext}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

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

          <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 pt-4 border-t border-gray-700/50 mt-6">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs sm:text-sm"
                onClick={saveAsDefault}
              >
                <Save className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Uložit jako výchozí</span>
                <span className="sm:hidden">Uložit</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-gray-400 hover:text-white hover:bg-gray-700/50 text-xs sm:text-sm"
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
                    className="text-xs text-green-400"
                  >
                    Uloženo!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center w-full sm:w-auto">
              <Button
                type="submit"
                disabled={isGenerating}
                className="flex items-center gap-1 bg-primary hover:bg-primary/90 w-full sm:w-auto justify-center"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generuji...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generovat shrnutí
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
