"use client";

import { useState, useEffect } from "react";
import { Book } from "@/types";
import BookComponent from "@/components/Book";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  AlertCircle,
  BookOpen,
  Search,
  Library,
  BookText,
  X,
  Info,
  PenLine,
  Sparkles,
  Loader2,
  Plus,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/modal";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/LoginForm";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const formVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
};

export default function Home() {
  const { user, loading } = useAuth();
  const [books, setBooks] = useLocalStorage<Book[]>("books", []);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showWelcome, setShowWelcome] = useLocalStorage("welcome-shown", true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    bookId: string;
    bookTitle: string;
  } | null>(null);
  const [isGeneratingAuthorSummary, setIsGeneratingAuthorSummary] =
    useState(false);
  const [includeAuthorSummary, setIncludeAuthorSummary] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond to keyboard shortcuts when not in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl/Cmd + / to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[placeholder="Hledat knihy..."]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Ctrl/Cmd + B to add new book (changed from N to avoid browser new window conflict)
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setShowAddForm(true);
      }

      // Escape to close add form
      if (e.key === "Escape" && showAddForm) {
        e.preventDefault();
        setShowAddForm(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showAddForm]);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const title = newBookTitle.trim();
    const author = newBookAuthor.trim();

    if (!title || !author) {
      setError("Prosím vyplňte název knihy a autora");
      return;
    }

    try {
      // Create the book in MongoDB
      const response = await fetch("/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          title,
          author,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create book");
      }

      const data = await response.json();
      const newBook = data.book;

      // If includeAuthorSummary is true, generate the author summary
      if (includeAuthorSummary) {
        try {
          setIsGeneratingAuthorSummary(true);

          // Check if the book already has an author summary
          if (!newBook.authorSummary) {
            const summaryResponse = await fetch(
              "/api/generate-author-summary",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  author: author,
                }),
              }
            );

            if (!summaryResponse.ok) {
              throw new Error("Failed to generate author summary");
            }

            const summaryData = await summaryResponse.json();
            newBook.authorSummary = summaryData.summary;
          }
        } catch (error) {
          console.error("Error generating author summary:", error);
          setError(
            "Nepodařilo se vygenerovat shrnutí autora. Kniha bude přidána bez shrnutí."
          );
        } finally {
          setIsGeneratingAuthorSummary(false);
        }
      }

      // Update the local state with the new book
      setBooks([...books, newBook]);

      // Reset form state
      setNewBookTitle("");
      setNewBookAuthor("");
      setIncludeAuthorSummary(false);
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding book:", error);
      setError(
        error instanceof Error ? error.message : "Nepodařilo se přidat knihu"
      );
    }
  };

  const handleDeleteBook = (bookId: string) => {
    const bookToDelete = books.find((book) => book.id === bookId);
    if (bookToDelete) {
      setDeleteConfirmation({
        isOpen: true,
        bookId,
        bookTitle: bookToDelete.title,
      });
    }
  };

  const confirmDeleteBook = () => {
    if (deleteConfirmation) {
      setBooks(books.filter((book) => book.id !== deleteConfirmation.bookId));
      setDeleteConfirmation(null);
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Načítání...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Čtenářský deník
          </h1>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {searchQuery && filteredBooks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 text-sm text-white flex items-center bg-secondary/30 p-2 px-3 rounded-lg border border-border/30"
          >
            <Search className="h-3.5 w-3.5 mr-2 text-primary" />
            Nalezeno{" "}
            <span className="font-medium text-primary mx-1">
              {filteredBooks.length}
            </span>
            {filteredBooks.length === 1
              ? "výsledek"
              : filteredBooks.length >= 2 && filteredBooks.length <= 4
              ? "výsledky"
              : "výsledků"}
            pro &quot;
            <span className="text-white font-medium border-b border-primary/50 pb-0.5">
              {searchQuery}
            </span>
            &quot;
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Zrušit
            </Button>
          </motion.div>
        )}

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="bg-card rounded-lg shadow-md border border-border/50 p-4 sm:p-6 mb-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center">
                  <BookText className="h-5 w-5 text-primary mr-2" />
                  Přidej novou knihu
                </h2>
                <Button
                  variant="icon"
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <form onSubmit={handleAddBook} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Název knihy
                    </label>
                    <div className="relative">
                      <input
                        id="title"
                        type="text"
                        value={newBookTitle}
                        onChange={(e) => {
                          setNewBookTitle(e.target.value);
                          setError("");
                        }}
                        placeholder="Název knihy..."
                        className={`w-full px-4 py-2 border ${
                          error ? "border-red-500/50" : "border-border/50"
                        } rounded-lg text-foreground focus:outline-none focus:ring-2 ${
                          error ? "focus:ring-red-500" : "focus:ring-primary"
                        } focus:border-transparent transition shadow-sm bg-secondary/50`}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="author"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Autor
                    </label>
                    <div className="relative">
                      <input
                        id="author"
                        type="text"
                        value={newBookAuthor}
                        onChange={(e) => {
                          setNewBookAuthor(e.target.value);
                          setError("");
                        }}
                        placeholder="Jméno autora..."
                        className={`w-full px-4 py-2 border ${
                          error ? "border-red-500/50" : "border-border/50"
                        } rounded-lg text-foreground focus:outline-none focus:ring-2 ${
                          error ? "focus:ring-red-500" : "focus:ring-primary"
                        } focus:border-transparent transition shadow-sm bg-secondary/50`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeAuthorSummary"
                    checked={includeAuthorSummary}
                    onChange={(e) => setIncludeAuthorSummary(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="includeAuthorSummary"
                    className="text-sm text-foreground flex items-center"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                    Vygenerovat shrnutí o autorovi
                  </label>
                </div>

                {error && (
                  <div className="bg-red-500/10 text-red-400 p-3 rounded-lg flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isGeneratingAuthorSummary}>
                    {isGeneratingAuthorSummary ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generuji shrnutí...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Přidat knihu
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoaded && (
          <>
            {books.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Library className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Zatím nemáš žádné knihy
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Začni přidáním své první knihy do čtenářského deníku.
                </p>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="shadow-md"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Přidat první knihu
                </Button>
              </motion.div>
            ) : filteredBooks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Žádné výsledky
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Pro hledaný výraz &quot;{searchQuery}&quot; nebyly nalezeny
                  žádné knihy.
                </p>
                <Button
                  onClick={() => setSearchQuery("")}
                  className="shadow-md"
                >
                  Zobrazit všechny knihy
                </Button>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-6"
                key={searchQuery}
              >
                {filteredBooks.map((book) => (
                  <BookComponent
                    key={book.id}
                    book={book}
                    onDelete={handleDeleteBook}
                  />
                ))}
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={confirmDeleteBook}
        title="Smazat knihu"
        description={
          deleteConfirmation
            ? `Opravdu chceš smazat knihu "${deleteConfirmation.bookTitle}" a všechny její poznámky?`
            : ""
        }
        confirmText="Smazat"
        variant="destructive"
        showCancelButton={false}
        showCloseButton={true}
      />

      {/* Welcome Modal */}
      <Modal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        title="Vítej v Čtenářském deníku!"
        showCloseButton={true}
      >
        <div className="p-5 max-w-full overflow-x-hidden">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
          </div>

          <h3 className="text-lg font-medium text-center text-white">
            Tvůj osobní čtenářský deník
          </h3>

          <p className="text-sm text-gray-300 text-center">
            Vítej v aplikaci, která ti pomůže sledovat knihy, které čteš, a
            zaznamenávat si k nim poznámky.
          </p>

          <div className="space-y-3 mt-6">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <PlusCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">
                  Přidej své knihy
                </h4>
                <p className="text-sm text-gray-300">
                  Začni přidáním knih, které čteš nebo jsi přečetl(a).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <PenLine className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">
                  Zaznamenávej poznámky
                </h4>
                <p className="text-sm text-gray-300">
                  Ke každé knize si můžeš přidat libovolné množství poznámek.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">
                  Generuj AI shrnutí
                </h4>
                <p className="text-sm text-gray-300">
                  Nech si vygenerovat shrnutí tvých poznámek pomocí umělé
                  inteligence.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700/50 flex justify-center mt-6">
            <Button onClick={() => setShowWelcome(false)}>
              Začít používat aplikaci
            </Button>
          </div>
        </div>
      </Modal>

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

            <div className="flex items-start gap-3 mt-4 bg-amber-500/10 p-3 rounded-md">
              <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-400">
                Klávesové zkratky fungují pouze když není aktivní žádné textové
                pole.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
