"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Modal } from "@/components/ui/modal";

export default function NavbarWrapper() {
  const { user, signOut } = useAuth();
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Only render the navbar if the user is logged in
  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar
        user={user || null}
        signOut={signOut}
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
              <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                <span className="text-sm text-gray-300">Vyhledávání</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded-md text-xs font-mono text-gray-300">
                  Ctrl + /
                </kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                <span className="text-sm text-gray-300">
                  Přidat novou knihu
                </span>
                <kbd className="px-2 py-1 bg-gray-800 rounded-md text-xs font-mono text-gray-300">
                  Ctrl + B
                </kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                <span className="text-sm text-gray-300">Zavřít formulář</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded-md text-xs font-mono text-gray-300">
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
