import { ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Portal } from "./portal";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  children?: ReactNode;
  confirmDisabled?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Potvrdit",
  cancelText = "Zrušit",
  children,
  confirmDisabled,
}: ModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    // Lock body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Modal Container */}
            <motion.div
              className="relative w-full max-w-md mx-4 z-[10000]"
              variants={{
                hidden: {
                  opacity: 0,
                  scale: 0.95,
                  y: 20,
                },
                visible: {
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  },
                },
                exit: {
                  opacity: 0,
                  scale: 0.95,
                  y: 20,
                  transition: {
                    duration: 0.2,
                  },
                },
              }}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <motion.div
                  className="flex items-center justify-between p-4 border-b border-gray-100"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>

                {/* Content */}
                <div className="p-4">
                  <motion.p
                    className="text-sm text-gray-600 mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {description}
                  </motion.p>
                  {children}
                </div>

                {/* Footer */}
                <motion.div
                  className="border-t border-gray-100 p-4 flex justify-end gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    variant="default"
                    onClick={onClose}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    {cancelText}
                  </Button>
                  <Button
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    disabled={confirmDisabled}
                  >
                    {confirmText}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
