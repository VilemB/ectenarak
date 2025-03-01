"use client";

import { Button } from "./button";
import { Modal } from "./modal";

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
      description={description}
      showCloseButton={showCloseButton}
    >
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        {showCancelButton && (
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
        )}
        <Button
          variant={variant === "destructive" ? "destructive" : "default"}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? "Zpracovávám..." : confirmText}
        </Button>
      </div>
    </Modal>
  );
}
