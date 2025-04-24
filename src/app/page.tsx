"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  Suspense,
  useMemo,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Book } from "@/types";
import { Button } from "@/components/ui/button";
import { Search, Plus, X, Coins } from "lucide-react";
import BookComponent from "@/components/Book";
import { motion, AnimatePresence } from "framer-motion";
import LandingPage from "@/components/LandingPage";
import Link from "next/link";
import AiCreditsDisplay from "@/components/AiCreditsDisplay";
import { toast } from "sonner";
import { SUBSCRIPTION_LIMITS } from "@/types/user";
import AddBookForm from "@/components/AddBookForm";

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

// Define PaginationData type
interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Define a simple type for raw note data
interface RawNoteData {
  _id: string;
  content: string;
  createdAt: string;
  isAISummary?: boolean;
  createdBy?: string; // Add other fields if present
}

// Update RawBookData to use RawNoteData[]
interface RawBookData {
  _id: string;
  title: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  authorSummary?: string | null;
  authorId?: string | null;
  userId: string;
  notes?: RawNoteData[]; // Use the defined interface array
}

// Define LoadingSpinner component locally
const LoadingSpinner = () => (
  <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-lg">Načítání...</p>
    </div>
  </div>
);

function HomeContent() {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading } = useSubscription();

  // Local state for books, loading, error, pagination
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(true);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  // Keep state for showing/hiding the form
  const [showAddForm, setShowAddForm] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce delay

    // Cleanup function to cancel the timeout if query changes quickly
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Function to fetch books
  const fetchBooks = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingBooks(true);
    setBooksError(null);
    try {
      const response = await fetch(`/api/books?userId=${user.id}`);
      if (!response.ok) {
        throw new Error("Nepodařilo se načíst knihy.");
      }
      const data = await response.json();
      // Use the RawBookData type for the incoming items
      const mappedBooks: Book[] = data.books.map((book: RawBookData) => ({
        id: book._id, // Map _id to id
        _id: book._id, // Assume Book type might also use _id
        title: book.title,
        author: book.author,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
        authorSummary: book.authorSummary,
        authorId: book.authorId,
        userId: book.userId,
        notes: book.notes, // Direct assignment if Book expects RawNoteData[] or similar
        // Map other fields as needed to match the Book interface
      }));
      setBooks(mappedBooks);
      setPagination(data.pagination);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Neznámá chyba";
      setBooksError(message);
      console.error("Error fetching books:", err);
    } finally {
      setIsLoadingBooks(false);
    }
  }, [user?.id]);

  // Fetch books on mount or when user changes
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Filtered books based on debounced search query
  const filteredBooks = useMemo(() => {
    if (!debouncedSearchQuery) {
      return books; // Return all books if search is empty
    }
    const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(lowerCaseQuery) ||
        book.author.toLowerCase().includes(lowerCaseQuery)
    );
  }, [books, debouncedSearchQuery]);

  // Calculate book limit display text
  const getLimitText = () => {
    if (
      authLoading ||
      subLoading ||
      isLoadingBooks ||
      !user ||
      !subscription ||
      !pagination
    ) {
      return null;
    }
    const currentTier = subscription.tier || "free";
    const limit = SUBSCRIPTION_LIMITS[currentTier].maxBooks;
    const count = pagination.total;

    if (limit === Infinity) {
      return `${count} / ∞ knih`;
    } else {
      return `${count} / ${limit} knih`;
    }
  };
  const limitText = getLimitText();

  // Delete Book Handler
  const handleDeleteBook = async (bookId: string) => {
    // Optimistic UI update (optional)
    // setBooks(prev => prev.filter(b => b.id !== bookId));
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        // Revert optimistic update if failed
        throw new Error("Nepodařilo se smazat knihu");
      }
      toast.success("Kniha smazána");
      await fetchBooks(); // Refetch books to confirm deletion and update count
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Neznámá chyba";
      toast.error(message);
      console.error("Delete error:", err);
      // fetchBooks(); // Optionally refetch even on error to get consistent state
    }
  };

  // Render logic
  if (authLoading || subLoading) {
    return <LoadingSpinner />;
  }
  if (!user) {
    return <LandingPage />;
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-auto sm:flex-1 md:flex-none md:w-64">
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
            disabled={showAddForm}
          >
            <Plus className="h-4 w-4 mr-2" />
            Přidat knihu
          </Button>
          {limitText && (
            <div className="w-full sm:w-auto text-left sm:text-right md:ml-4 mt-2 sm:mt-0">
              <p className="text-xs text-muted-foreground">
                Limit: {limitText}
              </p>
            </div>
          )}
        </div>
      </div>

      {debouncedSearchQuery && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-4 text-xs text-white flex items-center bg-secondary/30 p-2 px-3 rounded-lg border border-border/30"
        >
          <Search className="h-3 w-3 mr-2 text-primary" />
          Pro &quot;
          <span className="text-white font-medium border-b border-primary/50 pb-0.5 mx-1">
            {debouncedSearchQuery}
          </span>
          &quot; nalezen
          {filteredBooks.length === 1
            ? ""
            : filteredBooks.length >= 2 && filteredBooks.length <= 4
              ? "y"
              : "o"}{" "}
          <span className="font-medium text-primary mx-1">
            {filteredBooks.length}
          </span>
          {filteredBooks.length === 1
            ? "výsledek"
            : filteredBooks.length >= 2 && filteredBooks.length <= 4
              ? "výsledky"
              : "výsledků"}
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

      <AnimatePresence mode="wait">
        {showAddForm && user?.id ? (
          <motion.div
            key="add-book-form"
            initial={{ opacity: 0, y: -20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.3, ease: "easeOut" },
            }}
            exit={{
              opacity: 0,
              y: -10,
              transition: { duration: 0.2, ease: "easeIn" },
            }}
          >
            <AddBookForm
              userId={user.id}
              onBookAdded={fetchBooks}
              onClose={() => setShowAddForm(false)}
            />
          </motion.div>
        ) : (
          user && (
            <motion.div
              key="credits-display-section"
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.3, ease: "easeOut", delay: 0.1 },
              }}
              exit={{
                opacity: 0,
                y: 10,
                transition: { duration: 0.2, ease: "easeIn" },
              }}
              className="mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-gray-900/60 to-gray-800/60 rounded-lg p-3 border border-gray-700/40 shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center">
                  <div className="bg-amber-500/15 p-2 rounded-full mr-3 flex-shrink-0">
                    <Coins className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-white">
                        AI kredity
                      </h3>
                      {hasSubscription(user) &&
                        user.subscription.tier !== "free" && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400 border border-amber-800/30">
                            Obnova:{" "}
                            {new Date(
                              user.subscription.nextRenewalDate
                            ).getDate()}
                            .{" "}
                            {new Date(
                              user.subscription.nextRenewalDate
                            ).toLocaleString("cs-CZ", { month: "short" })}
                          </span>
                        )}
                    </div>
                    <div className="flex items-center mt-1.5">
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
                        className="w-full sm:w-64"
                      />
                    </div>
                  </div>
                </div>

                <div className="ml-9 sm:ml-0 mt-0.5 sm:mt-0 flex items-center">
                  {(
                    subscription &&
                    subscription.aiCreditsRemaining !== undefined
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
                      <span className="whitespace-nowrap">
                        Dostatek kreditů
                      </span>
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
          )
        )}
      </AnimatePresence>

      {isLoadingBooks ? (
        <LoadingSpinner />
      ) : booksError ? (
        <p className="text-red-500 text-center">{booksError}</p>
      ) : (
        <AnimatePresence>
          <motion.div className="grid grid-cols-1 gap-4 md:gap-5">
            {filteredBooks.length > 0 ? (
              filteredBooks.map((book) => (
                <BookComponent
                  key={book.id}
                  book={book}
                  onDelete={handleDeleteBook}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground col-span-full mt-8">
                {debouncedSearchQuery
                  ? `Pro "${debouncedSearchQuery}" nebyly nalezeny žádné knihy.`
                  : "Nemáte přidané žádné knihy."}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeContent />
    </Suspense>
  );
}
