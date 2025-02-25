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
  Menu,
  Plus,
  Library,
  BookText,
  X,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { generateId } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  const [books, setBooks] = useLocalStorage<Book[]>("books", []);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const title = newBookTitle.trim();
    const author = newBookAuthor.trim();

    if (!title || !author) {
      setError("Prosím vyplňte název knihy a autora");
      return;
    }

    // Check for duplicates
    if (
      books.some(
        (book) =>
          book.title.toLowerCase() === title.toLowerCase() &&
          book.author.toLowerCase() === author.toLowerCase()
      )
    ) {
      setError("Tato kniha od tohoto autora již existuje");
      return;
    }

    const newBook: Book = {
      id: generateId(),
      title: title,
      author: author,
      createdAt: new Date().toISOString(),
    };

    setBooks([...books, newBook]);
    setNewBookTitle("");
    setNewBookAuthor("");
    setShowAddForm(false);
  };

  // Add a test book for debugging
  const addTestBook = () => {
    const testBook: Book = {
      id: generateId(),
      title: "Testovací kniha",
      author: "Test Autor",
      createdAt: new Date().toISOString(),
    };
    setBooks([...books, testBook]);
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks(books.filter((book) => book.id !== bookId));
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 border-b border-border shadow-sm backdrop-blur-md"
        style={{ backgroundColor: "rgba(15, 23, 42, 0.8)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="h-7 w-7 text-primary mr-3" />
              <h1 className="text-2xl font-bold text-foreground">
                Čtenářský deník
              </h1>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  placeholder="Hledat knihy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="py-2 pl-10 pr-4 block w-64 rounded-full border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm transition-all bg-secondary"
                />
              </div>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Přidat knihu
              </Button>
              <Button
                onClick={addTestBook}
                className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm transition-colors"
              >
                Přidat testovací knihu
              </Button>
            </div>

            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="p-2 rounded-full text-primary hover:bg-primary/20 transition-colors"
                style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full text-foreground hover:bg-secondary transition-colors bg-secondary/50"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden py-3"
              >
                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    placeholder="Hledat knihy..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="py-2 pl-10 pr-4 block w-full rounded-full border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm bg-secondary"
                  />
                </div>
                <Button
                  onClick={addTestBook}
                  className="w-full rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm transition-colors mb-2"
                >
                  Přidat testovací knihu
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="bg-card rounded-lg shadow-md border border-border p-6 mb-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center">
                  <BookText className="h-5 w-5 text-primary mr-2" />
                  Přidej novou knihu
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-8 w-8 p-0"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="h-4 w-4" />
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
                          error ? "border-red-300" : "border-border"
                        } rounded-lg text-foreground focus:outline-none focus:ring-2 ${
                          error ? "focus:ring-red-500" : "focus:ring-primary"
                        } focus:border-transparent transition shadow-sm bg-secondary`}
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
                          error ? "border-red-300" : "border-border"
                        } rounded-lg text-foreground focus:outline-none focus:ring-2 ${
                          error ? "focus:ring-red-500" : "focus:ring-primary"
                        } focus:border-transparent transition shadow-sm bg-secondary`}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 text-red-500 p-3 rounded-lg flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Přidat knihu
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
                  className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
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
                  className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
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
    </>
  );
}
