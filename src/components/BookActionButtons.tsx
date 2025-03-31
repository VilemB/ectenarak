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

  // Helper function for handling feature access
  const handleFeatureAction = React.useCallback(
    (
      feature: "aiAuthorSummary" | "aiCustomization" | "exportToPdf",
      hasSubscription: boolean,
      action: () => void,
      isButtonGenerating: boolean,
      e?: React.MouseEvent<HTMLButtonElement> & { preventExport?: () => void }
    ) => {
      // Don't do anything if the button is in loading or generating state
      if (isButtonGenerating) {
        if (feature === "exportToPdf" && e?.preventExport) {
          e.preventExport();
        }
        return;
      }

      if (feature === "exportToPdf") {
        // For export feature, check subscription
        if (hasSubscription) {
          // Execute the action (which is empty for export, handled by ExportButton)
          action();
        } else {
          // Show subscription modal if user doesn't have subscription
          window.dispatchEvent(
            new CustomEvent("show-subscription-modal", {
              detail: {
                feature,
                needsCredits: false,
              },
            })
          );
          // Prevent the ExportButton's internal modal from opening
          if (e?.preventExport) {
            e.preventExport();
          }
        }
      } else {
        // For AI features, just execute the action
        // The modals will handle credit/subscription checks internally
        action();
      }
    },
    []
  );

  // Batch validate all features when component mounts - more efficient
  const validateAllFeatures = React.useCallback(() => {
    // Pre-validate all features at once and store results
    const authorSummaryAccess = canAccess("aiAuthorSummary");
    const aiCustomizationAccess = canAccess("aiCustomization");
    const exportAccess = canAccess("exportToPdf");
    const aiCreditsAvailable = hasAiCredits();

    // No need to re-check these for each button
    return {
      authorSummary: authorSummaryAccess,
      aiCustomization: aiCustomizationAccess,
      export: exportAccess,
      aiCredits: aiCreditsAvailable,
    };
  }, [canAccess, hasAiCredits]);

  // Run validation when component mounts
  React.useEffect(() => {
    validateAllFeatures();
  }, [validateAllFeatures]);

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
            className="h-8 border-blue-800/60 transition-all duration-200 rounded-md rounded-r-none border-r-0 px-2 sm:px-3 text-orange-400 hover:bg-blue-950/80 hover:text-orange-300 cursor-pointer"
            disabled={isGeneratingAuthorSummary}
            onClick={(e) => {
              e.preventDefault();
              handleFeatureAction(
                "aiAuthorSummary",
                hasAuthorSummarySubscription,
                handleAuthorSummaryModal,
                isGeneratingAuthorSummary,
                e
              );
            }}
          >
            {isGeneratingAuthorSummary ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin sm:mr-1.5"></div>
            ) : (
              <Sparkles className="h-3.5 w-3.5 sm:mr-1.5 text-orange-500" />
            )}
            <span className="hidden sm:inline">O autorovi</span>
          </Button>
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
            className="h-8 border-blue-800/60 transition-all duration-200 rounded-md px-2 sm:px-3 text-orange-400 hover:bg-blue-950/80 hover:text-orange-300 cursor-pointer"
            disabled={isGenerating}
            onClick={(e) => {
              e.preventDefault();
              handleFeatureAction(
                "aiCustomization",
                hasAiCustomizationSubscription,
                () => {
                  if (handleGenerateSummary) {
                    handleGenerateSummary();
                  }
                },
                isGenerating || false,
                e
              );
            }}
          >
            {isGenerating ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin sm:mr-1.5"></div>
            ) : (
              <Sparkles className="h-3.5 w-3.5 sm:mr-1.5 text-orange-500" />
            )}
            <span className="hidden sm:inline">AI shrnutí</span>
          </Button>
        </div>
      )}

      {/* Export Button */}
      {book.notes && book.notes.length > 0 && (
        <div className="relative">
          <ExportButton
            book={book}
            notes={book.notes}
            buttonProps={{
              disabled: isFeatureLoading(),
              variant: "outline",
              size: "sm",
              onClick: (e) => {
                // Check if e has stopPropagation method before calling it
                if (e && typeof e.stopPropagation === "function") {
                  e.stopPropagation();
                }

                // First check subscription directly
                if (!hasExportSubscription) {
                  // Prevent the export functionality
                  const customEvent = e as React.MouseEvent & {
                    preventExport?: () => void;
                  };
                  if (customEvent.preventExport) {
                    customEvent.preventExport();
                  }
                }

                handleFeatureAction(
                  "exportToPdf",
                  hasExportSubscription,
                  () => {}, // ExportButton has its own functionality when clicked
                  isFeatureLoading(),
                  e
                );
              },
              className: isFeatureLoading()
                ? "h-8 text-blue-300 opacity-80 border-blue-800/60 cursor-wait relative overflow-hidden rounded-md"
                : !hasExportSubscription
                ? "h-8 text-blue-300 border-blue-800/60 hover:bg-blue-950/80 hover:text-blue-200 cursor-pointer rounded-md"
                : "h-8 text-blue-300 border-blue-800/60 hover:bg-blue-950/80 hover:text-blue-200 cursor-pointer rounded-md",
            }}
          />

          {isFeatureLoading() && (
            <div className="absolute inset-0 overflow-hidden rounded-md z-10 pointer-events-none">
              <div className="animate-shine absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-md"></div>
            </div>
          )}

          {/* Lock indicator for export feature */}
          {!hasExportSubscription && !isFeatureLoading() && (
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
