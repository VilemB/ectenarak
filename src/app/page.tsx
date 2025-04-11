"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Book } from "@/types";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Search,
  Plus,
  PlusCircle,
  X,
  Sparkles,
  AlertCircle,
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
import AiCreditsDisplay from "@/components/AiCreditsDisplay";
import {
  SubscriptionProvider,
  useSubscriptionContext,
} from "@/contexts/SubscriptionContext";

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

function HomeContent() {
  const { user, loading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGeneratingAuthorSummary, setIsGeneratingAuthorSummary] =
    useState(false);
  const [includeAuthorSummary, setIncludeAuthorSummary] = useState(false);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [formStep, setFormStep] = useState(1);
  const [titleFocus, setTitleFocus] = useState(false);
  const [authorFocus, setAuthorFocus] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const [authorTouched, setAuthorTouched] = useState(false);

  const {
    subscription,
    loading: isLoadingSubscription,
    refreshSubscriptionData,
  } = useSubscriptionContext();

  // Function to fetch subscription data from the API
  const handleRefreshSubscription = useCallback(async () => {
    await refreshSubscriptionData();
  }, [refreshSubscriptionData]);

  // Fetch subscription data when user changes
  useEffect(() => {
    if (user) {
      handleRefreshSubscription();
    }
  }, [user, handleRefreshSubscription]);

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

            // Handle no credits response
            if (summaryResponse.status === 403) {
              const errorData = await summaryResponse.json();
              if (errorData.creditsRequired) {
                setShowAddForm(false);

                // Still add the book without the summary
                setBooks((prevBooks) => [newBook, ...prevBooks]);

                // Reset the form
                setNewBookTitle("");
                setNewBookAuthor("");
                setIncludeAuthorSummary(false);
                setFormStep(1);
                setTitleTouched(false);
                setAuthorTouched(false);

                setIsGeneratingAuthorSummary(false);
                return;
              }
            }

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
          className="bg-card border border-border/40 rounded-lg shadow-lg p-3 sm:p-4 mb-4 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80"></div>

          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-primary" />
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
              className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="w-full bg-muted/30 h-1 rounded-full mb-4 overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "50%" }}
              animate={{ width: formStep === 1 ? "50%" : "100%" }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <form onSubmit={handleAddBook} className="space-y-4 sm:space-y-5">
            {formStep === 1 ? (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="title"
                    className="flex items-center text-sm font-medium text-foreground mb-1.5"
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
                      className={`w-full px-4 py-2.5 border ${
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
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="author"
                    className="flex items-center text-sm font-medium text-foreground mb-1.5"
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
                      className={`w-full px-4 py-2.5 border ${
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
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center -mt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Načítání...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container max-w-5xl mx-auto px-2 sm:px-4 pt-2 pb-16 sm:pt-4 sm:pb-20 md:pt-6 md:pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            eČtenářák
          </h1>
          <p className="text-muted-foreground">
            Tvůj osobní elektronický čtenářský deník
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
              className="w-full pl-10 pr-4 py-2 border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent transition-all duration-200 shadow-sm bg-secondary/50 hover:bg-secondary/70"
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
          className="mb-4 text-xs text-white flex items-center bg-secondary/30 p-2 px-3 rounded-lg border border-border/30"
        >
          <Search className="h-3 w-3 mr-2 text-primary" />
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
          <span className="text-white font-medium border-b border-primary/50 pb-0.5 mx-1">
            {searchQuery}
          </span>
          &quot;
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 px-2 text-xs hover:bg-primary/10 hover:text-primary"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-3 w-3 mr-1" />
            Zrušit
          </Button>
        </motion.div>
      )}

      {/* AI Credits Display */}
      {user && !showAddForm && (
        <motion.div className="mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-gray-900/60 to-gray-800/60 rounded-lg p-3 border border-gray-700/40 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center">
              <div className="bg-amber-500/15 p-2 rounded-full mr-3 flex-shrink-0">
                <Coins className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="text-sm font-medium text-white">AI kredity</h3>
                  {hasSubscription(user) &&
                    user.subscription.tier !== "free" && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400 border border-amber-800/30">
                        Obnova:{" "}
                        {new Date(user.subscription.nextRenewalDate).getDate()}.{" "}
                        {new Date(
                          user.subscription.nextRenewalDate
                        ).toLocaleString("cs-CZ", { month: "short" })}
                      </span>
                    )}
                </div>
                <div className="flex items-center mt-1.5">
                  {isLoadingSubscription ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-amber-500 mr-2"></div>
                      <span className="text-xs text-gray-400">
                        Načítání kreditů...
                      </span>
                    </div>
                  ) : (
                    <AiCreditsDisplay
                      aiCreditsRemaining={
                        subscription?.aiCreditsRemaining !== undefined
                          ? subscription.aiCreditsRemaining
                          : hasSubscription(user)
                          ? user.subscription.aiCreditsRemaining
                          : 0
                      }
                      aiCreditsTotal={
                        subscription?.aiCreditsTotal !== undefined
                          ? subscription.aiCreditsTotal
                          : hasSubscription(user)
                          ? user.subscription.aiCreditsTotal
                          : 3
                      }
                      showLowCreditsWarning={false}
                      className="w-48 sm:w-64"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="ml-9 sm:ml-0 mt-0.5 sm:mt-0 flex items-center">
              {(
                subscription && subscription.aiCreditsRemaining !== undefined
                  ? subscription.aiCreditsRemaining ===
                    subscription.aiCreditsTotal
                  : hasSubscription(user)
                  ? user.subscription.aiCreditsRemaining ===
                    user.subscription.aiCreditsTotal
                  : false
              ) ? (
                <div className="flex items-center text-xs bg-green-900/30 text-green-400 py-1 px-2.5 rounded-full border border-green-800/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3.5 h-3.5 mr-1"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Plný počet kreditů</span>
                </div>
              ) : (subscription &&
                  subscription.aiCreditsRemaining !== undefined &&
                  subscription.aiCreditsRemaining <=
                    Math.ceil((subscription.aiCreditsTotal || 3) * 0.25)) ||
                (hasSubscription(user) &&
                  user.subscription.aiCreditsRemaining <=
                    Math.ceil(user.subscription.aiCreditsTotal * 0.25)) ? (
                <Link href="/subscription" className="group">
                  <div className="flex items-center text-xs bg-amber-900/30 text-amber-400 py-1 px-2.5 rounded-full border border-amber-800/30 cursor-pointer group-hover:bg-amber-900/40 transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3.5 h-3.5 mr-1"
                    >
                      <path d="M10.75 6.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" />
                    </svg>
                    <span>Získat více kreditů</span>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center text-xs bg-blue-900/30 text-blue-400 py-1 px-2.5 rounded-full border border-blue-800/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3.5 h-3.5 mr-1"
                  >
                    <path
                      fillRule="evenodd"
                      d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0zM1.75 14.5a.75.75 0 000 1.5c4.417 0 8.693.603 12.749 1.73 1.111.309 2.251-.512 2.251-1.696v-.784a.75.75 0 00-1.5 0v.784a.272.272 0 01-.35.25A49.043 49.043 0 001.75 14.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="whitespace-nowrap">Dostatek kreditů</span>
                </div>
              )}
            </div>
          </div>

          {((subscription &&
            subscription.aiCreditsRemaining !== undefined &&
            subscription.aiCreditsRemaining <=
              Math.ceil((subscription.aiCreditsTotal || 3) * 0.25)) ||
            (hasSubscription(user) &&
              user.subscription.aiCreditsRemaining <=
                Math.ceil(user.subscription.aiCreditsTotal * 0.25))) && (
            <p className="text-xs text-amber-400/80 mt-2 pl-11 flex items-center">
              <span className="inline-block mr-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-3.5 h-3.5 ${
                    subscription?.aiCreditsRemaining === 0 ||
                    (hasSubscription(user) &&
                      user.subscription.aiCreditsRemaining === 0)
                      ? "text-red-400"
                      : ""
                  }`}
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              {subscription?.aiCreditsRemaining === 0 ||
              (hasSubscription(user) &&
                user.subscription.aiCreditsRemaining === 0)
                ? "Vyčerpali jste všechny AI kredity. Kredit se využívá při generování AI obsahu."
                : "Docházejí vám kredity. Kredit se využívá při generování AI obsahu."}
            </p>
          )}
        </motion.div>
      )}

      {renderAddBookForm()}

      {isLoaded && (
        <>
          {books.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 sm:py-12 md:py-16 my-2 sm:my-4"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3">
                <Library className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1.5">
                Zatím nemáš žádné knihy
              </h2>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Začni přidáním své první knihy do čtenářského deníku.
              </p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="shadow-md hover:shadow-lg transition-all duration-200"
                size="default"
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
              className="grid grid-cols-1 gap-4 md:gap-5"
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
  );
}

export default function Home() {
  return (
    <SubscriptionProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Čtenářský deník",
            description:
              "Moderní digitální čtenářský deník s pokročilými AI funkcemi pro studenty středních škol a přípravu na maturitu",
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "CZK",
              availability: "https://schema.org/InStock",
            },
            featureList: [
              "AI generované shrnutí knih pro maturitu",
              "Pokročilá analýza autorů a literárních děl",
              "Export poznámek pro maturitní zkoušku",
              "Digitální čtenářský deník s AI asistencí",
              "Správa knih a poznámek pro školní četbu",
              "Automatické generování literárních analýz",
              "Příprava na maturitní otázky z literatury",
            ],
            audience: {
              "@type": "EducationalAudience",
              educationalRole: "Student",
              educationalLevel: "SecondaryEducation",
            },
            about: {
              "@type": "Thing",
              name: "Literární vzdělávání",
              description:
                "Pomoc s přípravou na maturitu z literatury a rozvojem čtenářských dovedností",
            },
            applicationSubCategory: "Literární vzdělávání",
            browserRequirements: "Requires JavaScript. Requires HTML5.",
            softwareVersion: "1.0",
            permissions: "Requires user authentication",
            screenshot: "https://ctenarsky-denik.vercel.app/screenshot.jpg",
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              ratingCount: "100",
              bestRating: "5",
              worstRating: "1",
            },
          }),
        }}
      />
      <HomeContent />
    </SubscriptionProvider>
  );
}
