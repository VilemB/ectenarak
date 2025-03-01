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
            <div className="min-h-screen px-4 flex items-center justify-center">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                aria-hidden="true"
                onClick={onClose} // Direct click handler on the backdrop
              />

              {/* Modal */}
              <motion.div
                ref={modalRef}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[90vh] overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()} // Prevent clicks from reaching the backdrop
              >
                {title && (
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {title}
                    </h3>
                    {showCloseButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={onClose}
                        aria-label="Close modal"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Zavřít</span>
                      </Button>
                    )}
                  </div>
                )}
                <div className="overflow-auto max-h-[calc(90vh-4rem)]">
                  {description && (
                    <div className="p-4 pt-6">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {description}
                      </p>
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
