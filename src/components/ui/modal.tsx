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

  useEffect(() => {
    setIsMounted(true);

    if (isOpen) {
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden";
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

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
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
                className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-gray-700/50 w-full max-w-lg max-h-[90vh] overflow-hidden relative z-10"
                onClick={(e) => {
                  e.preventDefault(); // Prevent default behavior
                  e.stopPropagation(); // Prevent clicks from reaching the backdrop
                }}
              >
                {title && (
                  <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
                    <h3 className="text-xl font-semibold text-white">
                      {title}
                    </h3>
                    {showCloseButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
                        onClick={onClose}
                        aria-label="Close modal"
                      >
                        <X className="h-5 w-5" />
                        <span className="sr-only">Zavřít</span>
                      </Button>
                    )}
                  </div>
                )}
                <div className="overflow-auto max-h-[calc(90vh-5rem)]">
                  {description && (
                    <div className="px-5 pt-4">
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
