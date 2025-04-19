"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { X, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface AddBookFormProps {
  userId: string;
  onBookAdded: () => Promise<void> | void;
  onClose: () => void;
}

// Animation variants for sliding steps
const variants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

const transition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.4,
};

export default function AddBookForm({
  userId,
  onBookAdded,
  onClose,
}: AddBookFormProps) {
  const [[step, direction], setStep] = useState([1, 0]); // [currentStep, animationDirection]
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [formError, setFormError] = useState("");
  const [titleError, setTitleError] = useState("");
  const [authorError, setAuthorError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const authorInputRef = useRef<HTMLInputElement>(null);

  // Autofocus logic based on step
  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      if (step === 1) {
        titleInputRef.current?.focus();
      } else if (step === 2) {
        authorInputRef.current?.focus();
      }
    }, 50);
    return () => clearTimeout(focusTimeout);
  }, [step]);

  const handleClose = () => {
    setFormError("");
    setTitleError("");
    setAuthorError("");
    setNewBookTitle("");
    setNewBookAuthor("");
    setStep([1, 0]); // Reset step
    onClose();
  };

  const validateStep1 = () => {
    const title = newBookTitle.trim();
    if (!title) {
      setTitleError("Název knihy je povinný");
      titleInputRef.current?.focus();
      return false;
    }
    setTitleError("");
    return true;
  };

  const validateStep2 = () => {
    const author = newBookAuthor.trim();
    if (!author) {
      setAuthorError("Jméno autora je povinné");
      authorInputRef.current?.focus();
      return false;
    }
    setAuthorError("");
    return true;
  };

  const paginate = (newDirection: number) => {
    setFormError(""); // Clear general error on step change

    if (newDirection > 0 && step === 1) {
      if (!validateStep1()) return;
    }

    setStep([step + newDirection, newDirection]);
  };

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError("");

    if (!validateStep1() || !validateStep2()) {
      // Should ideally not happen if step validation works, but good failsafe
      setFormError("Prosím vyplňte všechna povinná pole.");
      return;
    }

    setIsSubmitting(true);
    const title = newBookTitle.trim();
    const author = newBookAuthor.trim();

    try {
      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, author }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.limitReached) {
          toast.error(data.message, {
            action: {
              label: "Přejít na předplatné",
              onClick: () => router.push("/subscription"),
            },
            duration: 10000,
          });
          setFormError(data.message);
        } else {
          throw new Error(data.error || "Failed to create book");
        }
      } else {
        toast.success("Kniha úspěšně přidána!");
        await onBookAdded();
        handleClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Neznámá chyba";
      console.error("Error adding book:", err);
      setFormError(message);
      toast.error(`Chyba při přidávání knihy: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="mb-6 relative"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-book-heading"
    >
      <div className="bg-gradient-to-b from-card/80 to-card/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl overflow-hidden">
        <CardHeader className="relative pt-5 pb-4 px-6 border-b border-white/10">
          <div className="flex justify-between items-start mb-3">
            <div>
              <CardTitle id="add-book-heading" className="text-lg">
                Přidat novou knihu
              </CardTitle>
              <CardDescription className="mt-1">
                {step === 1
                  ? "Nejdříve zadejte název knihy."
                  : "Nyní zadejte jméno autora."}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/50 transition-colors -mt-1 -mr-2"
              aria-label="Zavřít formulář"
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Progress
              value={step === 1 ? 50 : 100}
              className="w-full h-1.5 bg-white/10"
            />
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {step}/2
            </span>
          </div>
        </CardHeader>

        <form
          onSubmit={step === 2 ? handleFinalSubmit : (e) => e.preventDefault()}
        >
          <CardContent className="p-6 min-h-[160px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                data-step={step}
              >
                {step === 1 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="add-book-title">
                      Název knihy <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      ref={titleInputRef}
                      id="add-book-title"
                      type="text"
                      value={newBookTitle}
                      onChange={(e) => {
                        setNewBookTitle(e.target.value);
                        if (titleError) setTitleError("");
                      }}
                      onBlur={validateStep1}
                      placeholder="Např. Hobit aneb Cesta tam a zase zpátky"
                      className={cn(
                        "bg-transparent border-white/10 focus-visible:ring-primary/30",
                        titleError &&
                          "border-destructive focus-visible:ring-destructive/50 bg-destructive/5"
                      )}
                      aria-required="true"
                      aria-invalid={!!titleError}
                      aria-describedby={titleError ? "title-error" : undefined}
                    />
                    {titleError && (
                      <p
                        id="title-error"
                        className="text-xs text-destructive"
                        role="alert"
                      >
                        {titleError}
                      </p>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="add-book-author">
                      Autor <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      ref={authorInputRef}
                      id="add-book-author"
                      type="text"
                      value={newBookAuthor}
                      onChange={(e) => {
                        setNewBookAuthor(e.target.value);
                        if (authorError) setAuthorError("");
                      }}
                      onBlur={validateStep2}
                      placeholder="Např. J. R. R. Tolkien"
                      className={cn(
                        "bg-transparent border-white/10 focus-visible:ring-primary/30",
                        authorError &&
                          "border-destructive focus-visible:ring-destructive/50 bg-destructive/5"
                      )}
                      required
                      aria-required="true"
                      aria-invalid={!!authorError}
                      aria-describedby={
                        authorError ? "author-error" : undefined
                      }
                    />
                    {authorError && (
                      <p
                        id="author-error"
                        className="text-xs text-destructive"
                        role="alert"
                      >
                        {authorError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground pt-1">
                      Název knihy: {newBookTitle}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>

          {formError && (
            <p
              className="text-sm text-destructive text-center px-6 pb-3"
              role="alert"
            >
              {formError}
            </p>
          )}

          <CardFooter className="flex justify-between items-center pt-5 pb-6 px-6 bg-black/10 border-t border-white/10">
            <div>
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => paginate(-1)}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zpět
                </Button>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-muted-foreground"
              >
                Zrušit
              </Button>

              {step === 1 && (
                <Button
                  type="button"
                  onClick={() => paginate(1)}
                  disabled={isSubmitting}
                >
                  Další
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              {step === 2 && (
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !newBookAuthor.trim() || !!authorError
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Přidávám...
                    </>
                  ) : (
                    "Přidat knihu"
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </form>
      </div>
    </motion.div>
  );
}
