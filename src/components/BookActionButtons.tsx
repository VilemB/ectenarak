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
  const { canAccess, hasAiCredits, isFeatureLoading } = useFeatureAccess();

  // Memoize subscription access checks for better performance
  const hasAuthorSummarySubscription = React.useMemo(
    () => canAccess("aiAuthorSummary"),
    [canAccess]
  );
  const hasAiCustomizationSubscription = React.useMemo(
    () => canAccess("aiCustomization"),
    [canAccess]
  );
  const hasExportSubscription = React.useMemo(
    () => canAccess("exportToPdf"),
    [canAccess]
  );

  // Memoize AI credits check for better performance
  const userHasAiCredits = React.useMemo(() => hasAiCredits(), [hasAiCredits]);

  // Check if features are loading
  const featureLoading = React.useMemo(
    () => isFeatureLoading(),
    [isFeatureLoading]
  );

  // Button should VISUALLY look disabled only if NO subscription access (show lock)
  // If user has subscription but no credits, button looks enabled but won't work
  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ml-auto">
      {/* Author Summary Button Group */}
      <div className="flex items-center">
        {/* Generate author summary button - improved for small screens */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className={`h-8 border-blue-800/60 transition-all duration-200 rounded-md rounded-r-none border-r-0 px-2 sm:px-3 ${
              featureLoading || isGeneratingAuthorSummary
                ? "text-orange-400 opacity-80 cursor-wait"
                : !hasAuthorSummarySubscription
                ? "text-orange-400 hover:bg-blue-950/80 hover:text-orange-300 cursor-pointer"
                : "text-orange-400 hover:bg-blue-950/80 hover:text-orange-300 cursor-pointer"
            }`}
            disabled={isGeneratingAuthorSummary || featureLoading}
            onClick={(e) => {
              e.preventDefault();
              if (!isGeneratingAuthorSummary && !featureLoading) {
                handleAuthorSummaryModal();
              }
            }}
          >
            {(featureLoading || isGeneratingAuthorSummary) && (
              <div className="absolute inset-0 overflow-hidden rounded-md rounded-r-none">
                <div className="animate-shine absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-md rounded-r-none"></div>
              </div>
            )}
            <Sparkles
              className={`h-3.5 w-3.5 sm:mr-1.5 ${
                !hasAuthorSummarySubscription
                  ? "text-orange-500/50"
                  : "text-orange-500"
              }`}
            />
            <span className="hidden sm:inline">O autorovi</span>
          </Button>

          {/* Lock indicator ONLY if subscription is missing */}
          {!hasAuthorSummarySubscription && !featureLoading && (
            <PremiumFeatureLock
              feature="aiAuthorSummary"
              requiredTier="basic"
              hasAiCredits={userHasAiCredits}
            />
          )}
        </div>

        {/* Delete author summary button - only show if we have an author summary */}
        {book.authorSummary && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-red-400 border-blue-800/60 hover:bg-blue-950/80 hover:text-red-300 rounded-md rounded-l-none transition-all duration-200 px-2 cursor-pointer"
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
            className={`h-8 border-blue-800/60 transition-all duration-200 rounded-md px-2 sm:px-3 ${
              featureLoading || isGenerating
                ? "text-orange-400 opacity-80 cursor-wait"
                : !hasAiCustomizationSubscription
                ? "text-orange-400 hover:bg-blue-950/80 hover:text-orange-300 cursor-pointer"
                : "text-orange-400 hover:bg-blue-950/80 hover:text-orange-300 cursor-pointer"
            }`}
            disabled={isGenerating || featureLoading}
            onClick={() => {
              if (!isGenerating && !featureLoading && handleGenerateSummary) {
                handleGenerateSummary();
              }
            }}
          >
            {(featureLoading || isGenerating) && (
              <div className="absolute inset-0 overflow-hidden rounded-md">
                <div className="animate-shine absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-md"></div>
              </div>
            )}
            <Sparkles
              className={`h-3.5 w-3.5 sm:mr-1.5 ${
                !hasAiCustomizationSubscription
                  ? "text-orange-500/50"
                  : "text-orange-500"
              }`}
            />
            <span className="hidden sm:inline">AI shrnutí</span>
          </Button>

          {/* Lock indicator ONLY if subscription is missing */}
          {!hasAiCustomizationSubscription && !featureLoading && (
            <PremiumFeatureLock
              feature="aiCustomization"
              requiredTier="basic"
              hasAiCredits={userHasAiCredits}
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
              disabled: false,
              variant: "outline",
              size: "sm",
              onClick: (e) => {
                // Check if e has stopPropagation method before calling it
                if (e && typeof e.stopPropagation === "function") {
                  e.stopPropagation();
                }
                if (!hasExportSubscription) {
                  // Show subscription modal if no access
                  window.dispatchEvent(
                    new CustomEvent("show-subscription-modal")
                  );
                  // Prevent the export functionality using type assertion
                  // Using a more specific type than 'any'
                  type CustomEvent = React.MouseEvent & {
                    preventExport?: () => void;
                  };
                  const customEvent = e as CustomEvent;
                  if (customEvent.preventExport) {
                    customEvent.preventExport();
                  }
                }
              },
              className: featureLoading
                ? "h-8 text-blue-300 opacity-80 border-blue-800/60 cursor-wait relative overflow-hidden rounded-md"
                : !hasExportSubscription
                ? "h-8 text-blue-300 border-blue-800/60 hover:bg-blue-950/80 hover:text-blue-200 cursor-pointer rounded-md"
                : "h-8 text-blue-300 border-blue-800/60 hover:bg-blue-950/80 hover:text-blue-200 cursor-pointer rounded-md",
            }}
          />

          {featureLoading && (
            <div className="absolute inset-0 overflow-hidden rounded-md z-10 pointer-events-none">
              <div className="animate-shine absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-md"></div>
            </div>
          )}

          {/* Lock indicator for export feature */}
          {!hasExportSubscription && !featureLoading && (
            <PremiumFeatureLock
              feature="exportToPdf"
              requiredTier="basic"
              hasAiCredits={false}
            />
          )}
        </div>
      )}

      {/* Delete book button - improved for small screens */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-red-400 border-blue-800/60 hover:bg-blue-950/80 hover:text-red-300 px-2 cursor-pointer rounded-md"
        onClick={handleBookDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="sr-only">Smazat</span>
      </Button>
    </div>
  );
}
