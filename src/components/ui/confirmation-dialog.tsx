"use client";

import { Button } from "./button";
import { Modal } from "./modal";
import { AlertTriangle } from "lucide-react";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  isLoading?: boolean;
  showCancelButton?: boolean;
  showCloseButton?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Potvrdit",
  cancelText = "Zrušit",
  variant = "default",
  isLoading = false,
  showCancelButton = true,
  showCloseButton = true,
}: ConfirmationDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      showCloseButton={showCloseButton}
    >
      <div className="p-5 space-y-4 modal-content">
        {variant === "destructive" && (
          <div className="flex items-center justify-center mb-2">
            <div className="bg-red-500/10 p-4 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        )}

        <p
          className={`text-sm ${
            variant === "destructive"
              ? "text-center text-gray-300"
              : "text-gray-300"
          }`}
        >
          {description}
        </p>

        <div className="border-t border-gray-700/50 pt-4 flex justify-end gap-3 mt-4">
          {showCancelButton && (
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="hover:bg-gray-700/50 text-gray-300 hover:text-white"
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isLoading}
            className={
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : ""
            }
          >
            {isLoading ? "Zpracovávám..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
