"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Modal } from "@/components/ui/modal";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NavbarWrapper() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Handle sign out with loading state
  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      // After successful sign-out, redirect to the landing page
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Failed to sign out:", error);
      toast.error("Nepodařilo se odhlásit");
      setIsSigningOut(false);
    }
  };

  // Only render the navbar if the user is logged in
  if (!user) {
    return null;
  }

  return (
    <>
      {isSigningOut && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/95 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-4"
          style={{ pointerEvents: "all" }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Odhlašování...</p>
        </motion.div>
      )}
      <Navbar
        user={user || null}
        signOut={handleSignOut}
        setShowKeyboardShortcuts={setShowKeyboardShortcuts}
      />

      {/* Keyboard Shortcuts Modal */}
      <Modal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        title="Klávesové zkratky"
        showCloseButton={true}
      >
        <div className="p-5 max-w-full overflow-x-hidden">
          <div className="space-y-4">
            <div className="space-y-2">
              {[
                {
                  id: "shortcut-search",
                  label: "Vyhledávání",
                  shortcut: "Ctrl + /",
                },
                {
                  id: "shortcut-add-book",
                  label: "Přidat novou knihu",
                  shortcut: "Ctrl + B",
                },
                {
                  id: "shortcut-close-form",
                  label: "Zavřít formulář",
                  shortcut: "Esc",
                },
              ].map((shortcut) => (
                <div
                  key={
                    shortcut.id ||
                    `shortcut-${Math.random().toString(36).substring(2, 11)}`
                  }
                  className="flex justify-between items-center py-2 border-b border-gray-700/50"
                >
                  <span className="text-sm text-gray-300">
                    {shortcut.label}
                  </span>
                  <kbd className="px-2 py-1 bg-gray-800 rounded-md text-xs font-mono text-gray-300">
                    {shortcut.shortcut}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
