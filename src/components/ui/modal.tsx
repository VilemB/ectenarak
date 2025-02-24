import { ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

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

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <motion.div
              className="flex items-center justify-between p-4 border-b border-gray-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-gray-700"
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
                className="bg-black hover:bg-gray-800"
              >
                {cancelText}
              </Button>
              <Button
                variant="default"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                disabled={confirmDisabled}
              >
                {confirmText}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
