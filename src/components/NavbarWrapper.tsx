"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Modal } from "@/components/ui/modal";
import { PlusCircle, BookText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NavbarWrapper() {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // We only show search bar on the home page where it's relevant
  const showSearchBar = true;

  return (
    <>
      <Navbar
        user={user || null}
        signOut={signOut}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setShowAddForm={setShowAddForm}
        setShowKeyboardShortcuts={setShowKeyboardShortcuts}
        showSearchBar={showSearchBar}
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

      {/* Add Book Form Modal - This is a simplified version, 
          the actual implementation should be done in the HomePage component */}
      {user && (
        <Modal
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          title="Přidat novou knihu"
          showCloseButton={true}
        >
          <div className="p-5 space-y-4">
            <div className="flex justify-center">
              <div className="bg-primary/10 p-4 rounded-full">
                <BookText className="h-10 w-10 text-primary" />
              </div>
            </div>
            <p className="text-center text-muted-foreground">
              Tato funkce je dostupná pouze na hlavní stránce.
            </p>
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  window.location.href = "/";
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Přejít na hlavní stránku
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
