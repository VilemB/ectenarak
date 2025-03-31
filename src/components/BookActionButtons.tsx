"use client";

import React from "react";
import { Book } from "@/types";
import { Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PremiumFeatureLock from "./FeatureLockIndicator";
import { ExportButton } from "./ExportButton";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import LoadingAnimation from "./LoadingAnimation";

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
  // Use the global subscription context for validation
  const { featureValidation, canAccessFeature } = useSubscriptionContext();
  const isValidating = featureValidation.isValidating;

  // Keep only the export subscription check that's actually used in JSX
  const hasExportSubscription = canAccessFeature("exportToPdf");

  // Helper function for handling feature action
  const handleFeatureAction = React.useCallback(
    (
      feature: "aiAuthorSummary" | "aiCustomization" | "exportToPdf",
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

      // Check subscription access using the global context
      const hasAccess = canAccessFeature(feature);

      if (feature === "exportToPdf") {
        // For export feature, check subscription
        if (hasAccess) {
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
      } else if (
        feature === "aiAuthorSummary" ||
        feature === "aiCustomization"
      ) {
        // For AI features, execute the action directly
        // The modal will check for AI credits internally
        action();

        // We don't check credits here anymore - let the modal check
        // This way we avoid the toast message with incorrect information
      } else {
        // For other features, just execute the action
        action();
      }
    },
    [canAccessFeature]
  );

  // Button should always be enabled for AI features
  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ml-auto">
      {/* Author Summary Button Group */}
      <div className="flex items-center">
        {/* Generate author summary button - improved for small screens */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className={`h-8 border-blue-800/60 transition-all duration-200 
              ${
                book.authorSummary
                  ? "rounded-md rounded-r-none border-r-0"
                  : "rounded-md"
              } 
              px-2 sm:px-3 text-orange-400 hover:bg-blue-950/80 hover:text-orange-300 cursor-pointer 
              ${isValidating ? "relative overflow-hidden" : ""}`}
            disabled={isGeneratingAuthorSummary || isValidating}
            onClick={(e) => {
              e.preventDefault();
              handleFeatureAction(
                "aiAuthorSummary",
                handleAuthorSummaryModal,
                isGeneratingAuthorSummary || isValidating,
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

          {/* Add loading animation when validating */}
          {isValidating && <LoadingAnimation />}
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
            className={`h-8 border-blue-800/60 transition-all duration-200 rounded-md px-2 sm:px-3 text-orange-400 hover:bg-blue-950/80 hover:text-orange-300 cursor-pointer ${
              isValidating ? "relative overflow-hidden" : ""
            }`}
            disabled={isGenerating || isValidating}
            onClick={(e) => {
              e.preventDefault();
              handleFeatureAction(
                "aiCustomization",
                () => {
                  if (handleGenerateSummary) {
                    handleGenerateSummary();
                  }
                },
                isGenerating || isValidating,
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

          {/* Add loading animation when validating */}
          {isValidating && <LoadingAnimation />}
        </div>
      )}

      {/* Export Button */}
      {book.notes && book.notes.length > 0 && (
        <div className="relative">
          <ExportButton
            book={book}
            notes={book.notes}
            buttonProps={{
              disabled: isValidating,
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
                  () => {}, // ExportButton has its own functionality when clicked
                  isValidating,
                  e
                );
              },
              className: isValidating
                ? "h-8 text-blue-300 opacity-80 border-blue-800/60 cursor-wait relative overflow-hidden rounded-md"
                : !hasExportSubscription
                ? "h-8 text-blue-300 border-blue-800/60 hover:bg-blue-950/80 hover:text-blue-200 cursor-pointer rounded-md"
                : "h-8 text-blue-300 border-blue-800/60 hover:bg-blue-950/80 hover:text-blue-200 cursor-pointer rounded-md",
            }}
          />

          {/* Replace the inline animation with the LoadingAnimation component */}
          {isValidating && <LoadingAnimation />}

          {/* Lock indicator for export feature */}
          {!hasExportSubscription && !isValidating && (
            <PremiumFeatureLock
              feature="exportToPdf"
              requiredTier="basic"
              hasAiCredits={false}
            />
          )}
        </div>
      )}

      {/* Delete Book Button */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-red-400 border-blue-800/60 hover:bg-blue-950/80 hover:text-red-300 rounded-md transition-all duration-200 px-2"
        onClick={handleBookDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="sr-only">Smazat knihu</span>
      </Button>
    </div>
  );
}
