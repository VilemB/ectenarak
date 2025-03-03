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
  ChevronRight,
  ChevronLeft,
  User,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/modal";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useAuth } from "@/hooks/useAuth";
import LandingPage from "@/components/LandingPage";

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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
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
  const [books, setBooks] = useState<Book[]>([]);
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
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [formStep, setFormStep] = useState(1);
  const [titleFocus, setTitleFocus] = useState(false);
  const [authorFocus, setAuthorFocus] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const [authorTouched, setAuthorTouched] = useState(false);

  // Fetch books from the database when the component mounts or user changes
  useEffect(() => {
    const fetchBooks = async () => {
      if (!user) return;

      setIsLoadingBooks(true);
      try {
        const response = await fetch(`/api/books?userId=${user.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch books");
        }

        const data = await response.json();

        // Transform the data to match the Book interface
        const formattedBooks = data.books.map(
          (book: {
            _id: string;
            title: string;
            author: string;
            createdAt: string;
            authorSummary?: string;
            authorId?: string;
            userId: string;
            notes?: Array<{
              _id: string;
              content: string;
              createdAt: string;
              isAISummary?: boolean;
            }>;
          }) => ({
            id: book._id,
            title: book.title,
            author: book.author,
            createdAt: book.createdAt,
            authorSummary: book.authorSummary || null,
            authorId: book.authorId || null,
            userId: book.userId,
            notes: book.notes || [],
          })
        );

        setBooks(formattedBooks);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setIsLoadingBooks(false);
      }
    };

    fetchBooks();
  }, [user]);

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
      setTitleTouched(true);
      setAuthorTouched(true);
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
      const newBook = {
        id: data.book.id,
        title: data.book.title,
        author: data.book.author,
        createdAt: data.book.createdAt,
        authorSummary: data.book.authorSummary || null,
        authorId: data.book.authorId || null,
        userId: data.book.userId,
      };

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
      setBooks((prevBooks) => [newBook, ...prevBooks]);

      // Reset the form
      setNewBookTitle("");
      setNewBookAuthor("");
      setIncludeAuthorSummary(false);
      setShowAddForm(false);
      setFormStep(1);
      setTitleTouched(false);
      setAuthorTouched(false);
    } catch (error) {
      console.error("Error adding book:", error);
      setError("Nepodařilo se přidat knihu. Zkuste to prosím znovu.");
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete book");
      }

      // Update local state after successful deletion
      setBooks(books.filter((book) => book.id !== bookId));
      setDeleteConfirmation(null);
    } catch (error) {
      console.error("Error deleting book:", error);
      setError("Failed to delete book. Please try again.");
    }
  };

  const showDeleteConfirmation = (bookId: string) => {
    const bookToDelete = books.find((book) => book.id === bookId);
    if (bookToDelete) {
      setDeleteConfirmation({
        isOpen: true,
        bookId,
        bookTitle: bookToDelete.title,
      });
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Replace the form JSX with this enhanced version
  const renderAddBookForm = () => (
    <AnimatePresence>
      {showAddForm && (
        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="bg-card border border-border/40 rounded-xl shadow-lg p-6 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80"></div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center">
              <BookText className="h-5 w-5 mr-2 text-primary" />
              Přidat novou knihu
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowAddForm(false);
                setFormStep(1);
                setError("");
                setNewBookTitle("");
                setNewBookAuthor("");
                setIncludeAuthorSummary(false);
                setTitleTouched(false);
                setAuthorTouched(false);
              }}
              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="w-full bg-muted/30 h-1 rounded-full mb-6 overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "50%" }}
              animate={{ width: formStep === 1 ? "50%" : "100%" }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <form onSubmit={handleAddBook} className="space-y-5">
            {formStep === 1 ? (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="title"
                    className="flex items-center text-sm font-medium text-foreground mb-1.5"
                  >
                    <BookOpen className="h-4 w-4 mr-1.5 text-primary" />
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
                        if (!titleTouched) setTitleTouched(true);
                      }}
                      onFocus={() => setTitleFocus(true)}
                      onBlur={() => setTitleFocus(false)}
                      placeholder="Např. Hobit aneb Cesta tam a zase zpátky..."
                      className={`w-full px-4 py-3 border ${
                        titleTouched && !newBookTitle.trim()
                          ? "border-red-500/50"
                          : titleFocus
                          ? "border-primary"
                          : "border-border/50"
                      } rounded-lg text-foreground focus:outline-none focus:ring-2 ${
                        titleTouched && !newBookTitle.trim()
                          ? "focus:ring-red-500/20"
                          : "focus:ring-primary/20"
                      } focus:border-transparent transition-all duration-200 shadow-sm bg-card`}
                    />
                    <AnimatePresence>
                      {titleTouched && !newBookTitle.trim() && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-xs text-red-500 mt-1 ml-1"
                        >
                          Prosím zadejte název knihy
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    type="button"
                    onClick={() => {
                      if (!newBookTitle.trim()) {
                        setTitleTouched(true);
                        return;
                      }
                      setFormStep(2);
                    }}
                    className="group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center">
                      Pokračovat
                      <ChevronRight className="h-4 w-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    <span className="absolute inset-0 bg-primary/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="author"
                    className="flex items-center text-sm font-medium text-foreground mb-1.5"
                  >
                    <User className="h-4 w-4 mr-1.5 text-primary" />
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
                        if (!authorTouched) setAuthorTouched(true);
                      }}
                      onFocus={() => setAuthorFocus(true)}
                      onBlur={() => setAuthorFocus(false)}
                      placeholder="Např. J.R.R. Tolkien..."
                      className={`w-full px-4 py-3 border ${
                        authorTouched && !newBookAuthor.trim()
                          ? "border-red-500/50"
                          : authorFocus
                          ? "border-primary"
                          : "border-border/50"
                      } rounded-lg text-foreground focus:outline-none focus:ring-2 ${
                        authorTouched && !newBookAuthor.trim()
                          ? "focus:ring-red-500/20"
                          : "focus:ring-primary/20"
                      } focus:border-transparent transition-all duration-200 shadow-sm bg-card`}
                    />
                    <AnimatePresence>
                      {authorTouched && !newBookAuthor.trim() && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-xs text-red-500 mt-1 ml-1"
                        >
                          Prosím zadejte jméno autora
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor="includeAuthorSummary"
                        className="flex items-center cursor-pointer"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            id="includeAuthorSummary"
                            checked={includeAuthorSummary}
                            onChange={(e) =>
                              setIncludeAuthorSummary(e.target.checked)
                            }
                            className="sr-only"
                          />
                          <div
                            className={`block w-10 h-6 rounded-full transition-colors duration-200 ${
                              includeAuthorSummary
                                ? "bg-amber-500"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          ></div>
                          <div
                            className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                              includeAuthorSummary
                                ? "transform translate-x-4"
                                : ""
                            }`}
                          ></div>
                        </div>
                        <div className="ml-3">
                          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Vygenerovat shrnutí o autorovi
                          </span>
                          <p className="text-xs text-amber-700 dark:text-amber-300/70 mt-0.5">
                            AI vygeneruje stručné informace o autorovi knihy
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-start border border-red-200 dark:border-red-800/30"
                  >
                    <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-red-500" />
                    <p className="text-sm">{error}</p>
                  </motion.div>
                )}

                <div className="flex justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormStep(1)}
                    className="group"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                    Zpět
                  </Button>
                  <Button
                    type="submit"
                    disabled={isGeneratingAuthorSummary}
                    className="relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center">
                      {isGeneratingAuthorSummary ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generuji shrnutí...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                          Přidat knihu
                        </>
                      )}
                    </span>
                    <span className="absolute inset-0 bg-primary/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                  </Button>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // If not logged in, show landing page
  if (!loading && !user) {
    return <LandingPage />;
  }

  // If loading, show loading spinner
  if (loading || isLoadingBooks) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Načítání...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!user && !loading ? (
        <LandingPage />
      ) : (
        <main className="container max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Můj čtenářský deník
              </h1>
              <p className="text-muted-foreground mt-1">
                Zaznamenej si své myšlenky a poznámky ke knihám, které čteš
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Hledat knihy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition shadow-sm bg-secondary/50"
                />
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                className="flex-none shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Přidat knihu
              </Button>
            </div>
          </div>

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

          {renderAddBookForm()}

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
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Přidat první knihu
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-6"
                >
                  {(searchQuery ? filteredBooks : books).map((book) => (
                    <BookComponent
                      key={book.id}
                      book={book}
                      onDelete={(bookId: string) =>
                        showDeleteConfirmation(bookId)
                      }
                    />
                  ))}
                </motion.div>
              )}
            </>
          )}
        </main>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation?.isOpen || false}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={() =>
          deleteConfirmation && handleDeleteBook(deleteConfirmation.bookId)
        }
        title="Smazat knihu"
        description={
          deleteConfirmation
            ? `Opravdu chcete smazat knihu "${deleteConfirmation.bookTitle}"? Tato akce je nevratná.`
            : ""
        }
        confirmText="Smazat knihu"
        cancelText="Zrušit"
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
