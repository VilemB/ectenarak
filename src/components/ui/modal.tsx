"use client";

import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { Portal } from "./portal";
import { motion, AnimatePresence } from "framer-motion";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
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

    // We'll rely on the backdrop click handler instead of this mousedown event
    // as it can sometimes interfere with interactions inside the modal

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
                className="bg-card rounded-lg shadow-xl border border-border w-full max-w-lg max-h-[90vh] overflow-hidden relative z-10"
                onClick={(e) => e.stopPropagation()} // Prevent clicks from reaching the backdrop
              >
                {title && (
                  <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                    <h2 className="text-lg font-semibold text-foreground">
                      {title}
                    </h2>
                    <button
                      onClick={onClose}
                      className="text-muted-foreground hover:text-foreground rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="Close modal"
                    >
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close</span>
                    </button>
                  </div>
                )}
                <div className="overflow-auto max-h-[calc(90vh-4rem)]">
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
