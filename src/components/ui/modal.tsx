"use client";

import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { Portal } from "./portal";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  showCloseButton = true,
}: ModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setIsMounted(true);

    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden";

      // Focus the modal
      setTimeout(() => {
        if (modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            (focusableElements[0] as HTMLElement).focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 50);
    } else {
      // Restore focus when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      // Re-enable scrolling when component unmounts
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key === "Tab" && modalRef.current) {
        // Get all focusable elements in the modal
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        // If shift+tab and on first element, move to last element
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
        // If tab and on last element, move to first element
        else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("keydown", handleTab);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
    };
  }, [isOpen, onClose]);

  if (!isMounted) return null;

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="min-h-screen px-4 flex items-center justify-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                aria-hidden="true"
                onClick={(e) => {
                  e.preventDefault(); // Prevent default behavior
                  e.stopPropagation(); // Stop propagation to prevent interaction with elements behind
                  onClose(); // Close the modal when clicking on the overlay
                }}
              />

              {/* Modal */}
              <motion.div
                ref={modalRef}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{
                  type: "spring",
                  damping: 30,
                  stiffness: 350,
                }}
                className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-gray-700/50 w-full max-w-lg max-h-[90vh] relative z-10 modal-content mx-2 sm:mx-0"
                onClick={(e) => {
                  e.preventDefault(); // Prevent default behavior
                  e.stopPropagation(); // Prevent clicks from reaching the backdrop
                }}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "modal-title" : undefined}
                onMouseDown={(e) => {
                  e.stopPropagation(); // Prevent mousedown from reaching elements behind
                }}
                onMouseUp={(e) => {
                  e.stopPropagation(); // Prevent mouseup from reaching elements behind
                }}
              >
                {title && (
                  <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-700/50">
                    <h3
                      className="text-lg sm:text-xl font-semibold text-white"
                      id="modal-title"
                    >
                      {title}
                    </h3>
                    {showCloseButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
                        onClick={onClose}
                        aria-label="Close modal"
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="sr-only">Zavřít</span>
                      </Button>
                    )}
                  </div>
                )}
                <div className="custom-scrollbar overflow-y-auto max-h-[calc(90vh-5rem)]">
                  {description && (
                    <div className="px-4 sm:px-5 pt-4">
                      <p className="text-sm text-gray-300">{description}</p>
                    </div>
                  )}
                  {children}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
