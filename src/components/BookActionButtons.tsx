"use client";

import React from "react";
import { Book } from "@/types";
import { Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import PremiumFeatureLock from "./FeatureLockIndicator";
import { ExportButton } from "./ExportButton";

// Create a separate component for action buttons in the book header
export default function BookActionButtons({
  book,
  handleAuthorSummaryModal,
  handleDeleteAuthorSummary,
  isGeneratingAuthorSummary,
  handleBookDelete,
  handleGenerateSummary,
  isGenerating,
}: {
  book: Book;
  handleAuthorSummaryModal: () => void;
  handleDeleteAuthorSummary: () => void;
  isGeneratingAuthorSummary: boolean;
  handleBookDelete: () => void;
  handleGenerateSummary?: () => void;
  isGenerating?: boolean;
}) {
  const { canAccess, hasAiCredits } = useFeatureAccess();

  // Check if the user has access to features
  const canUseAuthorSummary = canAccess("aiAuthorSummary") && hasAiCredits();
  const canUseAiSummary =
    handleGenerateSummary && canAccess("aiCustomization") && hasAiCredits();
  const canExportToPdf = canAccess("exportToPdf");

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ml-auto">
      {/* Author Summary Button Group */}
      <div className="flex items-center">
        {/* Generate author summary button - improved for small screens */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-950/50 transition-all duration-200 rounded-r-none border-r-0 px-2 sm:px-3"
            disabled={isGeneratingAuthorSummary || !canUseAuthorSummary}
            onClick={handleAuthorSummaryModal}
          >
            {isGeneratingAuthorSummary && (
              <div className="absolute inset-0 bg-primary/10 animate-pulse rounded-md"></div>
            )}
            <Sparkles className="h-3.5 w-3.5 sm:mr-1.5 text-primary" />
            <span className="hidden sm:inline">O autorovi</span>
          </Button>

          {/* Lock indicator if feature is not available */}
          {!canUseAuthorSummary && (
            <PremiumFeatureLock
              feature="aiAuthorSummary"
              requiredTier={canAccess("aiAuthorSummary") ? undefined : "basic"}
            />
          )}
        </div>

        {/* Delete author summary button - only show if we have an author summary */}
        {book.authorSummary && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-red-600 border-red-200/50 dark:text-red-500 dark:border-red-800/30 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-400 rounded-l-none transition-all duration-200 px-2"
            onClick={handleDeleteAuthorSummary}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Smazat informace o autorovi</span>
          </Button>
        )}
      </div>

      {/* AI Summary Button - if provided, improved for small screens */}
      {handleGenerateSummary && (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-950/50 transition-all duration-200 px-2 sm:px-3"
            disabled={isGenerating || !canUseAiSummary}
            onClick={handleGenerateSummary}
          >
            {isGenerating && (
              <div className="absolute inset-0 bg-primary/10 animate-pulse rounded-md"></div>
            )}
            <Sparkles className="h-3.5 w-3.5 sm:mr-1.5 text-primary" />
            <span className="hidden sm:inline">AI shrnutí</span>
          </Button>

          {/* Lock indicator if feature is not available */}
          {!canUseAiSummary && (
            <PremiumFeatureLock
              feature="aiCustomization"
              requiredTier={canAccess("aiCustomization") ? undefined : "basic"}
            />
          )}
        </div>
      )}

      {/* Export Button */}
      {book.notes && book.notes.length > 0 && (
        <div className="relative">
          <ExportButton
            book={book}
            notes={book.notes}
            buttonProps={{
              disabled: !canExportToPdf,
              variant: "outline",
              size: "sm",
              className:
                "h-8 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-950/50 transition-all duration-200 px-2 sm:px-3",
            }}
          />

          {/* Lock indicator for export feature */}
          {!canExportToPdf && (
            <PremiumFeatureLock feature="exportToPdf" requiredTier="basic" />
          )}
        </div>
      )}

      {/* Delete book button - improved for small screens */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-red-600 dark:text-red-500 border-red-200/50 dark:border-red-800/30 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-400 px-2"
        onClick={handleBookDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="sr-only">Smazat</span>
      </Button>
    </div>
  );
}
