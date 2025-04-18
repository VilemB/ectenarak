"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddBookFormProps {
  userId: string;
  onBookAdded: () => Promise<void> | void; // Callback after successful add
  onClose: () => void; // Callback to close the form
}

const formVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.2 },
  },
};

export default function AddBookForm({
  userId,
  onBookAdded,
  onClose,
}: AddBookFormProps) {
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [formError, setFormError] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [authorTouched, setAuthorTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Autofocus title input when form appears
  useEffect(() => {
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50); // Small delay to ensure element is rendered
  }, []);

  const handleClose = () => {
    setFormError("");
    setNewBookTitle("");
    setNewBookAuthor("");
    setTitleTouched(false);
    setAuthorTouched(false);
    onClose(); // Call parent close handler
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    // Clear previous general error, keep field-specific logic on blur
    setFormError("");

    // Mark fields as touched to trigger validation display if needed
    if (!titleTouched) setTitleTouched(true);
    if (!authorTouched) setAuthorTouched(true);

    const title = newBookTitle.trim();
    const author = newBookAuthor.trim();

    if (!title || !author) {
      setFormError("Prosím vyplňte název knihy a autora.");
      if (!title && titleInputRef.current) titleInputRef.current.focus(); // Focus first empty field
      // Optionally focus author field if title is filled but author isn't
      return;
    }
    setIsSubmitting(true);

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
              label: "Upgrade",
              onClick: () => router.push("/subscription"),
            },
          });
          setFormError(data.message);
        } else {
          throw new Error(data.error || "Failed to create book");
        }
      } else {
        toast.success("Kniha úspěšně přidána!");
        await onBookAdded(); // Call parent callback to refetch/update list
        handleClose(); // Close the form on success
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Neznámá chyba";
      console.error("Error adding book:", err);
      setFormError(message); // Display general error
      toast.error(`Chyba při přidávání knihy: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
      exit="exit" // Use defined exit variant
      className="bg-card border border-border/40 rounded-lg shadow-xl p-5 sm:p-6 mb-6 relative overflow-hidden backdrop-blur-sm"
      aria-labelledby="add-book-heading"
      role="dialog"
      aria-modal="true"
    >
      {/* Subtle gradient header */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 pointer-events-none"></div>

      {/* Header with Close button */}
      <div className="flex justify-between items-center mb-5">
        <h2
          id="add-book-heading"
          className="text-lg font-semibold text-foreground"
        >
          Přidat novou knihu
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
          aria-label="Zavřít formulář"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleAddBook} className="space-y-5">
        {/* Title Field */}
        <div>
          <label
            htmlFor="add-book-title"
            className="block text-sm font-medium mb-1.5 text-foreground/90"
          >
            Název knihy <span className="text-red-500">*</span>
          </label>
          <Input
            ref={titleInputRef} // Assign ref for autofocus
            id="add-book-title"
            type="text"
            value={newBookTitle}
            onChange={(e) => setNewBookTitle(e.target.value)}
            onBlur={() => {
              if (!titleTouched) setTitleTouched(true);
            }}
            placeholder="Např. Hobit aneb Cesta tam a zase zpátky"
            className={cn(
              "transition-colors duration-200 focus:border-primary focus:ring-primary/30",
              titleTouched &&
                !newBookTitle.trim() &&
                "border-red-500/70 focus:ring-red-500/30"
            )}
            required // Use HTML5 validation
            aria-required="true"
            aria-invalid={titleTouched && !newBookTitle.trim()}
            aria-describedby={
              titleTouched && !newBookTitle.trim() ? "title-error" : undefined
            }
          />
          {titleTouched && !newBookTitle.trim() && (
            <p id="title-error" className="text-xs text-red-500 mt-1.5">
              Název knihy je povinný
            </p>
          )}
        </div>

        {/* Author Field */}
        <div>
          <label
            htmlFor="add-book-author"
            className="block text-sm font-medium mb-1.5 text-foreground/90"
          >
            Autor <span className="text-red-500">*</span>
          </label>
          <Input
            id="add-book-author"
            type="text"
            value={newBookAuthor}
            onChange={(e) => setNewBookAuthor(e.target.value)}
            onBlur={() => {
              if (!authorTouched) setAuthorTouched(true);
            }}
            placeholder="Např. J. R. R. Tolkien"
            className={cn(
              "transition-colors duration-200 focus:border-primary focus:ring-primary/30",
              authorTouched &&
                !newBookAuthor.trim() &&
                "border-red-500/70 focus:ring-red-500/30"
            )}
            required // Use HTML5 validation
            aria-required="true"
            aria-invalid={authorTouched && !newBookAuthor.trim()}
            aria-describedby={
              authorTouched && !newBookAuthor.trim()
                ? "author-error"
                : undefined
            }
          />
          {authorTouched && !newBookAuthor.trim() && (
            <p id="author-error" className="text-xs text-red-500 mt-1.5">
              Jméno autora je povinné
            </p>
          )}
        </div>

        {/* General Form Error (API errors, etc.) */}
        {formError && (
          <p className="text-sm text-red-500 text-center py-2" role="alert">
            {formError}
          </p>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={
              isSubmitting || !newBookTitle.trim() || !newBookAuthor.trim()
            } // Disable if submitting or fields empty
            className="min-w-[130px] transition-opacity" // Fixed width
            aria-live="polite"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Přidávám...
              </>
            ) : (
              "Přidat knihu"
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
