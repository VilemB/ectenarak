"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Book } from "@/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  BookOpen,
  Search,
  Plus,
  PlusCircle,
  X,
  Info,
  Sparkles,
  AlertCircle,
  PenLine,
  Loader2,
  ChevronRight,
  ChevronLeft,
  User,
  Library,
  Coins,
} from "lucide-react";
import BookComponent from "@/components/Book";
import { motion, AnimatePresence } from "framer-motion";
import LandingPage from "@/components/LandingPage";
import Link from "next/link";

// Define interface for user with subscription
interface UserWithSubscription {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  subscription: {
    tier: string;
    startDate: Date;
    aiCreditsRemaining: number;
    aiCreditsTotal: number;
    isYearly: boolean;
    autoRenew: boolean;
  };
}

// Type guard to check if user has subscription
function hasSubscription(user: unknown): user is UserWithSubscription {
  if (!user || typeof user !== "object") return false;

  const maybeUserWithSub = user as Partial<UserWithSubscription>;
  if (!maybeUserWithSub.subscription) return false;

  const sub = maybeUserWithSub.subscription;
  return (
    typeof sub === "object" &&
    "aiCreditsRemaining" in sub &&
    "aiCreditsTotal" in sub
  );
}

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
      if (!user) {
        console.log("No user found, skipping book fetch");
        setIsLoadingBooks(false);
        return;
      }

      console.log("Fetching books for user:", user);

      if (!user.id) {
        console.error("User ID is missing:", user);
        setIsLoadingBooks(false);
        return;
      }

      setIsLoadingBooks(true);
      setError(""); // Clear any previous errors

      try {
        const response = await fetch(
          `/api/books?userId=${encodeURIComponent(user.id)}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API error:", errorData);

          // Set a user-friendly error message
          if (response.status === 500) {
            setError(
              "Nepodařilo se připojit k databázi. Zkontrolujte připojení k internetu nebo zkuste později."
            );
          } else {
            setError(
              `Chyba při načítání knih: ${
                errorData.error || response.statusText
              }`
            );
          }

          throw new Error(
            `Failed to fetch books: ${errorData.error || response.statusText}`
          );
        }

        const data = await response.json();

        // Debug the raw data
        console.log("Raw books data:", data);

        if (!data.books || !Array.isArray(data.books)) {
          console.error("Invalid books data format:", data);
          setBooks([]);
          setError("Nepodařilo se načíst knihy. Neplatný formát dat.");
          return;
        }

        // Transform the data to match the Book interface
        const formattedBooks = data.books
          .filter(
            (
              book:
                | {
                    _id?: string;
                    title?: string;
                    author?: string;
                    createdAt?: string;
                    authorSummary?: string;
                    authorId?: string;
                    userId?: string;
                    notes?: Array<{
                      _id: string;
                      content: string;
                      createdAt: string;
                      isAISummary?: boolean;
                    }>;
                  }
                | null
                | undefined
            ) => {
              // Additional client-side validation to catch any invalid books
              if (!book || Object.keys(book).length === 0) {
                console.error("Empty book object received from API:", book);
                return false;
              }

              if (!book._id) {
                console.error("Book without _id received from API:", book);
                return false;
              }

              if (!book.title || !book.author) {
                console.error("Book missing required fields:", book);
                return false;
              }

              return true;
            }
          )
          .map(
            (book: {
              _id: string; // Now we can be sure _id exists after filtering
              title: string; // Now we can be sure title exists after filtering
              author: string; // Now we can be sure author exists after filtering
              createdAt?: string;
              authorSummary?: string;
              authorId?: string;
              userId?: string;
              notes?: Array<{
                _id: string;
                content: string;
                createdAt: string;
                isAISummary?: boolean;
              }>;
            }) => {
              return {
                id: book._id,
                title: book.title,
                author: book.author,
                createdAt: book.createdAt || new Date().toISOString(),
                authorSummary: book.authorSummary || "",
                authorId: book.authorId || "",
                userId: book.userId || "",
                notes: book.notes || [],
              };
            }
          );

        // Debug the formatted books
        console.log("Formatted books:", formattedBooks);

        setBooks(formattedBooks);
        setError(""); // Clear any errors on success
      } catch (error) {
        console.error("Error fetching books:", error);
        // Only set a generic error if one hasn't been set already
        if (!error) {
          setError("Nepodařilo se načíst knihy. Zkuste to prosím později.");
        }
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
      const newBook: Book = {
        id: data.book.id,
        title: data.book.title,
        author: data.book.author,
        createdAt: data.book.createdAt,
        updatedAt: data.book.createdAt, // Set updatedAt to match createdAt initially
        authorSummary: data.book.authorSummary || null,
        authorId: data.book.authorId || null,
        userId: data.book.userId,
        notes: [],
      };

      // If includeAuthorSummary is true, generate the author summary
      if (includeAuthorSummary) {
        try {
          setIsGeneratingAuthorSummary(true);

          // Check if the book already has an author summary
          if (!newBook.authorSummary) {
            const summaryResponse = await fetch("/api/author-summary", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                author: author,
                bookId: newBook.id, // Pass the bookId to associate the summary with this book
                // Use default preferences for automatic generation
                preferences: {
                  style: "academic",
                  length: "medium",
                  focus: "balanced",
                  language: "cs",
                  includeTimeline: false,
                  includeAwards: false,
                  includeInfluences: false,
                  studyGuide: false,
                },
              }),
            });

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

  const handleDeleteBook = async (bookId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete book");
      }

      // Update local state after successful deletion
      setBooks(books.filter((book) => book.id !== bookId));
    } catch (error) {
      console.error("Error deleting book:", error);
      setError("Failed to delete book. Please try again.");
      throw error; // Re-throw the error so the caller can handle it
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
          className="bg-card border border-border/40 rounded-xl shadow-lg p-7 mb-10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/80 via-primary to-primary/80"></div>

          <div className="flex justify-between items-center mb-7">
            <h2 className="text-xl font-semibold text-foreground flex items-center">
              <BookOpen className="h-5 w-5 mr-2.5 text-primary" />
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
              className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="w-full bg-muted/30 h-1.5 rounded-full mb-7 overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "50%" }}
              animate={{ width: formStep === 1 ? "50%" : "100%" }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <form onSubmit={handleAddBook} className="space-y-6">
            {formStep === 1 ? (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="title"
                    className="flex items-center text-sm font-medium text-foreground mb-2"
                  >
                    <BookOpen className="h-4 w-4 mr-2 text-primary" />
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
                      className={`w-full px-4 py-3.5 border ${
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
                          className="text-xs text-red-500 mt-1.5 ml-1"
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
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="author"
                    className="flex items-center text-sm font-medium text-foreground mb-2"
                  >
                    <User className="h-4 w-4 mr-2 text-primary" />
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
                      className={`w-full px-4 py-3.5 border ${
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
                          className="text-xs text-red-500 mt-1.5 ml-1"
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
                  className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-5 border border-amber-200 dark:border-amber-800/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-11 w-11 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
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
                            className={`block w-11 h-6 rounded-full transition-colors duration-200 ${
                              includeAuthorSummary
                                ? "bg-amber-500"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          ></div>
                          <div
                            className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                              includeAuthorSummary
                                ? "transform translate-x-5"
                                : ""
                            }`}
                          ></div>
                        </div>
                        <div className="ml-3.5">
                          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Vygenerovat shrnutí o autorovi
                          </span>
                          <p className="text-xs text-amber-700 dark:text-amber-300/70 mt-0.5">
                            AI vygeneruje stručné akademické informace o
                            autorovi knihy s použitím výchozích nastavení
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {includeAuthorSummary && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 ml-14"
                    >
                      <div className="text-xs text-amber-700 dark:text-amber-300/70 bg-amber-100/50 dark:bg-amber-900/20 p-3 rounded-md border border-amber-200/50 dark:border-amber-800/20">
                        <p>
                          <strong>Výchozí nastavení:</strong> Akademický styl,
                          střední délka, vyvážené zaměření, v češtině.
                        </p>
                        <p className="mt-1.5">
                          Nastavení můžete později změnit kliknutím na tlačítko
                          &quot;Aktualizovat informace o autorovi&quot;.
                        </p>
                      </div>
                    </motion.div>
                  )}
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
        <main className="container max-w-5xl mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Můj čtenářský deník
              </h1>
              <p className="text-muted-foreground mt-1.5">
                Zaznamenej si své myšlenky a poznámky ke knihám, které čteš
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="z-50 absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground search-icon" />
                <input
                  type="text"
                  placeholder="Hledat knihy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent transition-all duration-200 shadow-sm bg-secondary/50 hover:bg-secondary/70"
                />
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                className="flex-none shadow-sm hover:shadow-md transition-all duration-200"
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
              className="mb-6 text-sm text-white flex items-center bg-secondary/30 p-2.5 px-4 rounded-lg border border-border/30"
            >
              <Search className="h-3.5 w-3.5 mr-2.5 text-primary" />
              Nalezeno{" "}
              <span className="font-medium text-primary mx-1.5">
                {filteredBooks.length}
              </span>
              {filteredBooks.length === 1
                ? "výsledek"
                : filteredBooks.length >= 2 && filteredBooks.length <= 4
                ? "výsledky"
                : "výsledků"}
              pro &quot;
              <span className="text-white font-medium border-b border-primary/50 pb-0.5 mx-1">
                {searchQuery}
              </span>
              &quot;
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 px-2.5 text-xs hover:bg-primary/10 hover:text-primary"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Zrušit
              </Button>
            </motion.div>
          )}

          {/* AI Credits Display */}
          {user && !showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 bg-gradient-to-r from-gray-900/60 to-gray-800/60 rounded-xl p-5 border border-gray-700/40 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-primary/15 p-2.5 rounded-full mr-4">
                    <Coins className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-white">
                      AI kredity
                    </h3>
                    <div className="flex items-center mt-1.5">
                      <div className="w-36 h-2 bg-gray-800 rounded-full overflow-hidden mr-3">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-blue-400"
                          style={{
                            width: `${
                              ((hasSubscription(user)
                                ? user.subscription.aiCreditsRemaining
                                : 3) /
                                (hasSubscription(user)
                                  ? user.subscription.aiCreditsTotal
                                  : 3)) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-primary">
                        {hasSubscription(user)
                          ? user.subscription.aiCreditsRemaining
                          : 3}{" "}
                        /{" "}
                        {hasSubscription(user)
                          ? user.subscription.aiCreditsTotal
                          : 3}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {(
                    hasSubscription(user)
                      ? user.subscription.aiCreditsRemaining ===
                        user.subscription.aiCreditsTotal
                      : true
                  ) ? (
                    <span className="text-xs bg-green-900/30 text-green-400 py-1.5 px-3 rounded-full border border-green-800/30">
                      Plný počet kreditů
                    </span>
                  ) : hasSubscription(user) &&
                    user.subscription.aiCreditsRemaining <=
                      Math.ceil(user.subscription.aiCreditsTotal * 0.25) ? (
                    <Link href="/subscription">
                      <span className="text-xs bg-amber-900/30 text-amber-400 py-1.5 px-3 rounded-full border border-amber-800/30 cursor-pointer hover:bg-amber-900/40 transition-colors">
                        Získat více kreditů
                      </span>
                    </Link>
                  ) : (
                    <span className="text-xs bg-blue-900/30 text-blue-400 py-1.5 px-3 rounded-full border border-blue-800/30">
                      {(() => {
                        // Calculate next renewal date
                        const today = new Date();
                        const startDate = hasSubscription(user)
                          ? new Date(user.subscription.startDate)
                          : new Date(today.getFullYear(), today.getMonth(), 1);

                        const nextRenewal = new Date(
                          today.getFullYear(),
                          today.getMonth() + 1,
                          startDate.getDate()
                        );

                        // If the renewal day has already passed this month, use this month's date
                        if (startDate.getDate() > today.getDate()) {
                          nextRenewal.setMonth(today.getMonth());
                        }

                        // Format date nicely in Czech
                        const options: Intl.DateTimeFormatOptions = {
                          day: "numeric",
                          month: "long",
                        };
                        return `Obnovení ${nextRenewal.toLocaleDateString(
                          "cs-CZ",
                          options
                        )}`;
                      })()}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {renderAddBookForm()}

          {isLoaded && (
            <>
              {books.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 my-8"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                    <Library className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground mb-3">
                    Zatím nemáš žádné knihy
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Začni přidáním své první knihy do čtenářského deníku.
                  </p>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="shadow-md hover:shadow-lg transition-all duration-200"
                    size="lg"
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Přidat první knihu
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-8"
                >
                  {(searchQuery ? filteredBooks : books).map((book) => {
                    // Debug each book before rendering
                    console.log("Rendering book:", book);

                    // Check if book is valid
                    if (!book || Object.keys(book).length === 0) {
                      console.error("Warning: Empty book object in list");
                      return null;
                    }

                    return (
                      <BookComponent
                        key={
                          book.id ||
                          `book-${Math.random().toString(36).substring(2, 11)}`
                        }
                        book={book}
                        onDelete={handleDeleteBook}
                      />
                    );
                  })}
                </motion.div>
              )}
            </>
          )}
        </main>
      )}

      {/* Welcome Modal */}
      <Modal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        title="Vítej v Čtenářském deníku!"
        showCloseButton={true}
      >
        <div className="p-6 max-w-full overflow-x-hidden">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary/15 p-5 rounded-full">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
          </div>

          <h3 className="text-xl font-medium text-center text-white mb-2">
            Tvůj osobní čtenářský deník
          </h3>

          <p className="text-sm text-gray-300 text-center mb-8">
            Vítej v aplikaci, která ti pomůže sledovat knihy, které čteš, a
            zaznamenávat si k nim poznámky.
          </p>

          <div className="space-y-4 mt-6">
            {[
              {
                id: "feature-add-books",
                icon: <PlusCircle className="h-5 w-5 text-primary" />,
                title: "Přidej své knihy",
                description:
                  "Začni přidáním knih, které čteš nebo jsi přečetl(a).",
              },
              {
                id: "feature-add-notes",
                icon: <PenLine className="h-5 w-5 text-primary" />,
                title: "Zaznamenávej poznámky",
                description:
                  "Ke každé knize si můžeš přidat libovolné množství poznámek.",
              },
              {
                id: "feature-ai-summary",
                icon: <Sparkles className="h-5 w-5 text-primary" />,
                title: "Generuj AI shrnutí",
                description:
                  "Nech si vygenerovat shrnutí tvých poznámek pomocí umělé inteligence.",
              },
            ].map((feature) => (
              <div
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-800/30 transition-colors"
                key={
                  feature.id ||
                  `feature-${Math.random().toString(36).substring(2, 11)}`
                }
              >
                <div className="bg-primary/15 p-2.5 rounded-full">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-base font-medium text-white mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-300">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-700/50 flex justify-center mt-8">
            <Button
              onClick={() => setShowWelcome(false)}
              className="px-6 py-2.5 shadow-md hover:shadow-lg transition-all duration-200"
              size="lg"
            >
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
        <div className="p-6 max-w-full overflow-x-hidden">
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
                  className="flex justify-between items-center py-3 px-4 border-b border-gray-700/50 rounded-lg hover:bg-gray-800/20 transition-colors"
                >
                  <span className="text-sm text-gray-300 flex items-center">
                    {shortcut.label === "Vyhledávání" && (
                      <Search className="h-4 w-4 mr-2 text-primary/70" />
                    )}
                    {shortcut.label === "Přidat novou knihu" && (
                      <Plus className="h-4 w-4 mr-2 text-primary/70" />
                    )}
                    {shortcut.label === "Zavřít formulář" && (
                      <X className="h-4 w-4 mr-2 text-primary/70" />
                    )}
                    {shortcut.label}
                  </span>
                  <kbd className="px-3 py-1.5 bg-gray-800 rounded-md text-xs font-mono text-gray-300 border border-gray-700/50 shadow-sm">
                    {shortcut.shortcut}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 mt-6 bg-amber-500/10 p-4 rounded-lg border border-amber-500/20">
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
