"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Book, Note } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  PenLine,
  Sparkles,
  ChevronDown,
  Trash2,
  X,
  AlertCircle,
  User,
  Calendar,
  Copy,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import {
  SummaryPreferencesModal,
  SummaryPreferences,
} from "./SummaryPreferencesModal";
import { ExportButton } from "./ExportButton";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  AuthorSummaryPreferencesModal,
  AuthorSummaryPreferences,
} from "@/components/AuthorSummaryPreferencesModal";
import { NoteEditor } from "@/components/NoteEditor";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useSubscriptionContext } from "@/app/page";
import { AiCreditsExhaustedPrompt } from "./FeatureGate";
import { Modal } from "@/components/ui/modal";
import BookActionButtons from "./BookActionButtons";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

// Study-friendly content formatter component
const StudyContent = ({ content }: { content: string }) => {
  return (
    <div className="study-summary">
      <div
        className="prose prose-amber prose-sm md:prose prose-invert 
                   prose-headings:mt-6 prose-headings:mb-3 prose-headings:font-bold prose-headings:text-orange-300 
                   prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                   prose-p:my-3 prose-p:text-sm md:prose-p:text-base prose-p:leading-relaxed prose-p:text-blue-100
                   prose-li:ml-4 prose-li:my-1 prose-li:text-blue-100
                   prose-strong:text-orange-300
                   prose-em:text-orange-200
                   max-w-none"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

interface BookProps {
  book: Book;
  onDelete: (bookId: string) => void;
  layout?: "grid" | "list" | "compact";
}

// Close button component for the top-right corner
const CloseButtonTop = ({
  onClick,
  label,
  title,
}: {
  onClick: () => void;
  label: string;
  title: string;
}) => (
  <div className="absolute -top-2 -right-2 z-10">
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        variant="ghost"
        size="sm"
        className="bg-blue-900 hover:bg-blue-800 text-blue-300 h-7 w-7 p-0 rounded-full shadow-sm border border-blue-800/70 transition-all duration-200"
        onClick={onClick}
        aria-label={label}
        title={title}
      >
        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Zavřít</span>
      </Button>
    </motion.div>
  </div>
);

// Close button component for the bottom
const CloseButtonBottom = ({
  onClick,
  text,
}: {
  onClick: () => void;
  text: string;
}) => (
  <Button
    variant="outline"
    size="sm"
    className="text-blue-400 border-blue-800/50 hover:bg-blue-950/50 transition-all duration-200"
    onClick={onClick}
  >
    <X className="h-3.5 w-3.5 mr-1.5" />
    <span>{text}</span>
  </Button>
);

// Delete button component
const DeleteButton = ({
  onClick,
  text,
}: {
  onClick: () => void;
  text: string;
}) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
  >
    <Trash2 className="h-3.5 w-3.5" />
    <span className="hidden sm:inline">{text}</span>
  </motion.button>
);

// Copy button component
const CopyButton = ({
  onClick,
  text,
}: {
  onClick: (e?: React.MouseEvent) => void;
  text: string;
}) => (
  <motion.button
    onClick={(e) => {
      e.stopPropagation(); // Stop event propagation
      onClick(e);
    }}
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    className="text-xs text-blue-200 hover:text-blue-100 flex items-center gap-1.5 transition-colors"
  >
    <Copy className="h-3.5 w-3.5" />
    <span className="hidden sm:inline">{text}</span>
  </motion.button>
);

// Break out the notes list into a separate component for better organization
const NotesList = ({
  notes,
  activeNoteFilter,
  activeNoteId,
  handleDeleteNote,
  handleCopyNote,
  handleViewSummary,
  handleCloseSummary,
  bookTitle,
}: {
  notes: Note[];
  activeNoteFilter: "all" | "manual" | "ai";
  activeNoteId: string | null;
  handleDeleteNote: (noteId: string) => void;
  handleCopyNote: (content: string, e?: React.MouseEvent) => void;
  handleViewSummary: (noteId: string, e?: React.KeyboardEvent) => void;
  handleCloseSummary: () => void;
  bookTitle: string;
}) => {
  const filteredNotes = notes.filter((note) => {
    if (activeNoteFilter === "all") return true;
    if (activeNoteFilter === "ai" && note.isAISummary) return true;
    if (activeNoteFilter === "manual" && !note.isAISummary) return true;
    return false;
  });

  if (filteredNotes.length === 0) {
    return (
      <div className="text-center py-6 text-blue-200 bg-blue-950/40 rounded-lg border border-blue-900/40">
        <p>Žádné poznámky odpovídající vybranému filtru.</p>
        {activeNoteFilter !== "all" && (
          <p className="text-sm mt-1 text-blue-300">
            Zkuste změnit filtr nebo přidat novou poznámku.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredNotes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          isActive={activeNoteId === note.id}
          onDelete={handleDeleteNote}
          onCopy={handleCopyNote}
          onView={handleViewSummary}
          onClose={handleCloseSummary}
          bookTitle={bookTitle}
        />
      ))}
    </div>
  );
};

// Break out AI summary content for better organization
const AISummaryContent = ({
  note,
  isActive,
  onView,
  onClose,
  onCopy,
  onDelete,
}: {
  note: Note;
  isActive: boolean;
  onView: (noteId: string, e?: React.KeyboardEvent) => void;
  onClose: () => void;
  onCopy: (content: string, e?: React.MouseEvent) => void;
  onDelete: (noteId: string) => void;
}) => {
  return (
    <div>
      {isActive ? (
        <div className="relative bg-gradient-to-br from-blue-950 to-blue-900/80 rounded-lg p-4 mt-2 border border-blue-800/40 shadow-inner w-[95%] max-w-[650px] z-10 mx-auto my-4">
          {/* Close button - positioned absolutely in the top-right corner */}
          <CloseButtonTop
            onClick={onClose}
            label="Zavřít shrnutí knihy"
            title="Zavřít shrnutí knihy (ESC)"
          />

          {/* ESC key indicator */}
          <div className="flex justify-between items-start mb-5">
            <div></div> {/* Empty div for spacing */}
            <div className="hidden sm:flex items-center gap-1.5 bg-blue-900/60 px-2.5 py-1 rounded-md border border-blue-800/70 shadow-sm">
              <kbd className="px-2 py-0.5 text-xs font-semibold text-blue-200 bg-blue-800 rounded border border-blue-700 shadow-sm">
                ESC
              </kbd>
              <span className="text-xs font-medium text-blue-300">
                zavřít panel
              </span>
            </div>
          </div>

          {/* AI summary content with improved contrast */}
          <div className="prose prose-invert prose-headings:text-orange-300 prose-strong:text-orange-200 prose-em:text-orange-300/90 max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
              {note.content}
            </ReactMarkdown>
          </div>

          <div className="mt-6 pt-4 border-t border-blue-800/40 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <CopyButton
                onClick={(e) => onCopy(note.content, e)}
                text="Kopírovat"
              />
              <DeleteButton onClick={() => onDelete(note.id)} text="Smazat" />
            </div>
            <CloseButtonBottom onClick={onClose} text="Zavřít" />
          </div>
        </div>
      ) : (
        <div className="prose prose-amber prose-sm dark:prose-invert max-w-none relative">
          <ReactMarkdown>{note.content.split("\n\n")[0]}</ReactMarkdown>
          {note.content.split("\n\n").length > 1 && (
            <div
              className="mt-2 text-orange-400 text-sm cursor-pointer hover:underline flex items-center gap-1.5 font-medium group"
              onClick={() => onView(note.id)}
              onKeyDown={(e) => onView(note.id, e)}
              tabIndex={0}
              role="button"
              aria-expanded={isActive}
              aria-controls={`expanded-summary-${note.id}`}
            >
              <span>Zobrazit celé shrnutí</span>
              <ChevronDown className="h-3.5 w-3.5 group-hover:translate-y-0.5 transition-transform duration-200" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Break out individual note items for better encapsulation
const NoteItem = ({
  note,
  isActive,
  onDelete,
  onCopy,
  onView,
  onClose,
  bookTitle,
}: {
  note: Note;
  isActive: boolean;
  onDelete: (noteId: string) => void;
  onCopy: (content: string, e?: React.MouseEvent) => void;
  onView: (noteId: string, e?: React.KeyboardEvent) => void;
  onClose: () => void;
  bookTitle: string;
}) => {
  return (
    <div
      key={note.id}
      id={`note-${note.id}`}
      className={`bg-background rounded-lg p-3 sm:p-4 border border-border/60 transition-all duration-300 ease-out
                ${
                  isActive
                    ? "ring-1 ring-primary/20 shadow-md"
                    : "hover:border-border/80 hover:shadow-sm"
                }`}
    >
      {/* Note Header */}
      <div className="flex flex-wrap items-start justify-between mb-2">
        <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-0">
          {note.isAISummary ? (
            <Sparkles className="h-4 w-4 text-orange-500" />
          ) : (
            <PenLine className="h-4 w-4 text-blue-400" />
          )}
          <span
            className={`text-xs ${
              note.isAISummary ? "text-orange-400" : "text-blue-300"
            }`}
          >
            {note.isAISummary ? "AI Shrnutí" : "Moje poznámka"}
          </span>
          <span className="text-xs text-blue-300/90">
            {formatDate(note.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {note.isAISummary && (
            <div>
              <ExportButton
                content={note.content}
                filename={`${bookTitle}_shrnutí.md`}
                buttonProps={{
                  variant: "ghost",
                  size: "sm",
                  className: "h-7 w-7 p-0 text-blue-300 hover:text-blue-200",
                }}
              />
            </div>
          )}
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-blue-300 hover:text-blue-200"
              onClick={() => onView(note.id)}
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="sr-only">Zobrazit shrnutí</span>
            </Button>
          </div>
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
              onClick={() => onDelete(note.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Smazat poznámku</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Note Content */}
      <div
        className={`transition-all duration-300 ease-out ${
          isActive ? "opacity-100" : "opacity-90"
        }`}
      >
        {note.isAISummary ? (
          <AISummaryContent
            note={note}
            isActive={isActive}
            onView={onView}
            onClose={onClose}
            onCopy={onCopy}
            onDelete={onDelete}
          />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{note.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

// Create a separate component for the book header with improved expand/collapse interaction
const BookHeader = ({
  book,
  isExpanded,
  toggleExpanded,
  handleBookDelete,
  isAuthorInfoVisible,
  setAuthorSummaryModal,
  handleDeleteAuthorSummary,
  isGeneratingAuthorSummary,
  handleAuthorSummaryToggle,
}: {
  book: Book;
  isExpanded: boolean;
  toggleExpanded: (e?: React.MouseEvent | React.KeyboardEvent) => void;
  handleBookDelete: () => void;
  isAuthorInfoVisible: boolean;
  setAuthorSummaryModal: (open: boolean) => void;
  handleDeleteAuthorSummary: () => void;
  isGeneratingAuthorSummary: boolean;
  handleAuthorSummaryToggle: (e: React.MouseEvent) => void;
}) => {
  return (
    <div
      className={`relative cursor-pointer
                  ${
                    isExpanded
                      ? "bg-blue-950 pt-5 pb-4 px-4 sm:pt-6 sm:pb-5 sm:px-5"
                      : "bg-blue-950 p-3 sm:p-4"
                  } 
                  ${isExpanded ? "border-b border-blue-900/60" : ""} 
                  group hover:bg-blue-950/90`}
      onClick={toggleExpanded}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleExpanded(e);
        }
      }}
      tabIndex={0}
      role="button"
      aria-expanded={isExpanded}
      aria-controls={`book-content-${book.id}`}
      title={isExpanded ? "Klikněte pro zavření" : "Klikněte pro rozbalení"}
    >
      {/* Book bookmark indicator */}
      <div className="absolute right-3 sm:right-4 top-0 w-2 h-10 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 bg-blue-600 rounded-b-sm shadow-sm transition-all ease"
          style={{
            transform: isExpanded ? "translateY(0)" : "translateY(-20px)",
            height: isExpanded ? "100%" : "70%",
            transitionDuration: "250ms",
          }}
        >
          {/* Fold shadow effect */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-black/10 to-transparent"></div>
        </div>
      </div>

      {/* Main header content */}
      <div className="flex flex-col gap-2 pr-10 sm:pr-12">
        {/* Title and Author section */}
        <div>
          <h3
            className={`text-lg sm:text-xl font-medium text-blue-100 group-hover:text-blue-50 transition-colors line-clamp-2 ${
              isExpanded ? "text-blue-50" : ""
            }`}
          >
            {book.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-sm font-medium cursor-pointer inline-flex items-center gap-1 text-blue-200 group-hover:text-blue-100 transition-colors relative"
              onClick={handleAuthorSummaryToggle}
            >
              {book.author}
              {book.authorSummary && (
                <span
                  className="relative flex h-2 w-2 items-center justify-center"
                  aria-label={
                    isAuthorInfoVisible
                      ? "Zavřít informace o autorovi"
                      : "Zobrazit informace o autorovi"
                  }
                >
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 bg-blue-500 
                               ${
                                 isAuthorInfoVisible
                                   ? "opacity-100"
                                   : "opacity-70"
                               } 
                               transition-all duration-300`}
                  />
                  {isAuthorInfoVisible && (
                    <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-blue-700 animate-pulse" />
                  )}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Improved metadata and action buttons layout */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          {/* Book Metadata with improved wrapping */}
          <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-blue-300/90">
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
              <span>{formatDate(book.createdAt)}</span>
            </div>
            {book.notes && book.notes.length > 0 && (
              <div className="flex items-center">
                <PenLine className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                <span>
                  {book.notes.length}{" "}
                  {book.notes.length === 1
                    ? "poznámka"
                    : book.notes.length > 1 && book.notes.length < 5
                    ? "poznámky"
                    : "poznámek"}
                </span>
              </div>
            )}

            {/* Toggle indicator */}
            <div className="flex items-center ml-1">
              <div className="text-xs flex items-center gap-1.5 text-blue-400">
                <ChevronDown
                  className={`h-3.5 w-3.5 transform transition-transform duration-200 ease ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
                <span className="hidden sm:inline text-xs">
                  {isExpanded ? "Zavřít" : "Rozbalit"}
                </span>

                <span className="hidden sm:inline-flex text-xs ml-1 items-center text-zinc-400">
                  <kbd className="px-1 py-0.5 text-[10px] font-mono bg-blue-900/40 rounded border border-blue-800/50">
                    {isExpanded ? "ESC" : "Enter"}
                  </kbd>
                </span>
              </div>
            </div>
          </div>

          {/* Import and use the standalone BookActionButtons component with improved positioning */}
          <div className="flex justify-start sm:justify-end mt-1 sm:mt-0">
            <BookActionButtons
              book={book}
              handleAuthorSummaryModal={() => setAuthorSummaryModal(true)}
              handleDeleteAuthorSummary={handleDeleteAuthorSummary}
              isGeneratingAuthorSummary={isGeneratingAuthorSummary}
              handleBookDelete={handleBookDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function BookComponent({
  book: initialBook,
  onDelete,
}: BookProps) {
  // Only import what we actually use from useSubscription
  const { refreshSubscription } = useSubscription();
  const { refreshSubscriptionData } = useSubscriptionContext();
  // Add useFeatureAccess hook
  const { canAccess, hasAiCredits } = useFeatureAccess();

  // Function to refresh all subscription data
  const refreshAllSubscriptionData = useCallback(async () => {
    try {
      // Await both promises to ensure they complete
      await refreshSubscription();
      await refreshSubscriptionData();
    } catch (error) {
      console.error("Error refreshing subscription data:", error);
    }
  }, [refreshSubscription, refreshSubscriptionData]);

  // Get the auth context properly
  const authContext = useAuth();
  const useAiCreditRef = useRef(authContext.useAiCredit);

  // Update the ref if auth changes
  useEffect(() => {
    useAiCreditRef.current = authContext.useAiCredit;
  }, [authContext]);

  // Validate the book object
  const safeBook: Book = useMemo(() => {
    return {
      id: initialBook.id || `temp-${Date.now()}`,
      title: initialBook.title || "Untitled Book",
      author: initialBook.author || "Unknown Author",
      authorId: initialBook.authorId || "",
      userId: initialBook.userId || "",
      status: initialBook.status || "not_started",
      notes: Array.isArray(initialBook.notes) ? initialBook.notes : [],
      createdAt: initialBook.createdAt || new Date().toISOString(),
      updatedAt: initialBook.updatedAt || new Date().toISOString(),
      authorSummary: initialBook.authorSummary,
    };
  }, [initialBook]);

  // State
  const [book, setBook] = useState<Book>(safeBook);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAuthorSummary, setIsGeneratingAuthorSummary] =
    useState(false);
  const [summaryModal, setSummaryModal] = useState(false);
  const [authorSummaryModal, setAuthorSummaryModal] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isAuthorInfoVisible, setIsAuthorInfoVisible] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "book" | "note" | "authorSummary";
    noteId?: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    type: "book",
    isLoading: false,
  });
  const [savedScrollPosition, setSavedScrollPosition] = useState<number | null>(
    null
  );
  const [activeNoteFilter, setActiveNoteFilter] = useState<
    "all" | "manual" | "ai"
  >("all");
  const [notes, setNotes] = useState<Note[]>([]);
  const [errorMessages, setErrorMessages] = useState<
    Array<{ id: string; message: string }>
  >([]);
  const [successMessages, setSuccessMessages] = useState<
    Array<{ id: string; message: string }>
  >([]);
  const [showCreditExhaustedModal, setShowCreditExhaustedModal] =
    useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  // Refs
  const bookRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Add a function to show error messages
  const showErrorMessage = useCallback((message: string) => {
    const id = Math.random().toString(36).substring(2, 11);
    setErrorMessages((prev) => [...prev, { id, message }]);

    // Auto-remove the error message after 5 seconds
    setTimeout(() => {
      setErrorMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 5000);
  }, []);

  // Add a function to show success messages
  const showSuccessMessage = useCallback((message: string) => {
    const id = Math.random().toString(36).substring(2, 11);
    setSuccessMessages((prev) => [...prev, { id, message }]);

    // Auto-remove the success message after 3 seconds
    setTimeout(() => {
      setSuccessMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 3000);
  }, []);

  // Function to fetch notes
  const fetchNotes = useCallback(
    async (bookId: string) => {
      try {
        setIsLoadingNotes(true);
        const response = await fetch(`/api/books/${bookId}/notes`);
        if (!response.ok) {
          throw new Error("Failed to fetch notes");
        }
        const data = await response.json();

        // Format the notes from the response
        const formattedNotes = data.notes.map(
          (note: {
            _id: string;
            content: string;
            createdAt: string;
            isAISummary?: boolean;
          }) => ({
            id: note._id,
            bookId: bookId,
            content: note.content,
            createdAt: new Date(note.createdAt).toISOString(),
            isAISummary: note.isAISummary || false,
          })
        );

        setNotes(formattedNotes);
      } catch (error) {
        console.error("Error fetching notes:", error);
        showErrorMessage(
          "Nepodařilo se načíst poznámky. Zkuste to prosím znovu."
        );
      } finally {
        setIsLoadingNotes(false);
      }
    },
    [showErrorMessage]
  );

  // Update local book state when props change, with validation
  useEffect(() => {
    if (initialBook && Object.keys(initialBook).length > 0) {
      setBook(initialBook);

      // Pre-fetch notes when the component mounts
      if (initialBook.id) {
        fetchNotes(initialBook.id);
      }
    }
  }, [initialBook, fetchNotes]);

  // Add a function to handle closing the author summary with scroll position preservation
  const handleCloseAuthorInfo = useCallback(() => {
    // Save the current scroll position before closing
    setSavedScrollPosition(window.scrollY);

    // Close the author info immediately - this prevents the flashing issue
    // by letting the AnimatePresence handle the exit animation properly
    setIsAuthorInfoVisible(false);
  }, []);

  // Create a more robust function for handling author summary toggling
  const handleAuthorSummaryToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent toggling the book

      // If we already have an author summary, toggle its visibility
      if (book.authorSummary) {
        // Add a subtle animation effect on toggle
        const authorElement = document.getElementById(`author-${book.id}`);
        if (authorElement) {
          if (!isAuthorInfoVisible) {
            // When opening, start slightly scaled down and fade in
            authorElement.style.opacity = "0";
            authorElement.style.transform = "scale(0.98)";

            // Force a reflow to ensure the initial state is applied
            void authorElement.offsetWidth;

            // Then animate to normal
            authorElement.style.transition =
              "opacity 0.25s ease, transform 0.3s ease";
            authorElement.style.opacity = "1";
            authorElement.style.transform = "scale(1)";
          }
        }

        setIsAuthorInfoVisible(!isAuthorInfoVisible);
      } else {
        // If no author summary yet, open the modal to generate one
        setAuthorSummaryModal(true);
      }
    },
    [book.authorSummary, book.id, isAuthorInfoVisible, setAuthorSummaryModal]
  );

  // Add a helper function to scroll to newly added notes
  const scrollToNewlyAddedNote = useCallback((noteId: string) => {
    // Use setTimeout to ensure the DOM has updated
    setTimeout(() => {
      const noteElement = document.getElementById(`note-${noteId}`);

      if (noteElement) {
        // Get the position of the book element
        const bookRect = bookRef.current?.getBoundingClientRect();
        const bookTopOffset = bookRect ? bookRect.top + window.scrollY : 0;

        // Get the note's position relative to the document
        const noteRect = noteElement.getBoundingClientRect();

        // Calculate the target scroll position
        // Ensures the note is visible with some space above it
        const scrollTarget = window.scrollY + noteRect.top - 120;

        // Only scroll if the target is below the book's top position
        // This prevents scrolling above the book element
        const finalScrollTarget = Math.max(scrollTarget, bookTopOffset);

        window.scrollTo({
          top: finalScrollTarget,
          behavior: "smooth",
        });

        // Add a temporary highlight effect to the new note
        noteElement.classList.add(
          "ring-2",
          "ring-orange-400",
          "ring-opacity-70"
        );

        // Remove the highlight effect after 1.5 seconds
        setTimeout(() => {
          noteElement.classList.remove(
            "ring-2",
            "ring-orange-400",
            "ring-opacity-70"
          );
        }, 1500);
      }
    }, 100);
  }, []);

  // Handle animation completion after closing author summary
  const handleAnimationComplete = useCallback(() => {
    if (savedScrollPosition !== null) {
      // Scroll to the book element instead of restoring previous position
      if (bookRef.current) {
        bookRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
      setSavedScrollPosition(null);
    }
  }, [savedScrollPosition]);

  // Function to handle adding a new note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setIsAddingNote(true);
      const response = await fetch(`/api/books/${book.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newNote,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add note");
      }

      const data = await response.json();

      // Format the notes from the response
      const formattedNotes = data.notes.map(
        (note: {
          _id: string;
          content: string;
          createdAt: string;
          isAISummary?: boolean;
        }) => ({
          id: note._id,
          bookId: book.id,
          content: note.content,
          createdAt: new Date(note.createdAt).toISOString(),
          isAISummary: note.isAISummary || false,
        })
      );

      // Update the notes state
      setNotes(formattedNotes);

      // Clear the textarea
      setNewNote("");

      // Show success message
      showSuccessMessage("Poznámka byla úspěšně přidána");

      // Set filter to show all notes or regular notes if we're currently on AI filter
      if (activeNoteFilter === "ai") {
        setActiveNoteFilter("all");
      }

      // Scroll to the newly added note
      const newNoteId = formattedNotes[formattedNotes.length - 1]?.id;
      if (newNoteId) {
        scrollToNewlyAddedNote(newNoteId);
      }
    } catch (error) {
      console.error("Error adding note:", error);
      showErrorMessage("Nepodařilo se přidat poznámku");
    } finally {
      setIsAddingNote(false);
    }
  };

  // Improve the toggleExpanded function to maintain scroll position
  const toggleExpanded = useCallback(
    (e?: React.MouseEvent | React.KeyboardEvent) => {
      // Only prevent toggling when clicking on specific interactive elements
      if (
        e &&
        e.target instanceof HTMLElement &&
        (e.target.tagName === "BUTTON" ||
          e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA" ||
          e.target.tagName === "A" ||
          e.target.closest("button") ||
          e.target.closest("a") ||
          e.target.closest("input") ||
          e.target.closest("textarea") ||
          e.target.closest("[data-no-toggle]"))
      ) {
        // Allow the event to bubble up and be handled by the element
        return;
      }

      // If it's a keyboard event, only toggle on Enter or Space
      if (e && "key" in e) {
        if (e.key !== "Enter" && e.key !== " ") {
          return;
        }

        // Prevent scrolling on space press
        if (e.key === " ") {
          e.preventDefault();
        }
      }

      // Save the current scroll position
      const scrollPosition = window.scrollY;

      // Get the book element's position before toggle
      const bookPosition = bookRef.current?.getBoundingClientRect()?.top;
      const bookTopRelativeToPage =
        bookPosition !== undefined ? bookPosition + window.scrollY : null;

      // Toggle the expanded state
      setIsExpanded(!isExpanded);

      // If we're expanding and don't have notes yet, fetch them
      if (!isExpanded && notes.length === 0 && book.id) {
        fetchNotes(book.id);
      }

      // Maintain the book's position in the viewport after toggling
      // This prevents unwanted scrolling when expanding or collapsing
      if (bookTopRelativeToPage !== null && bookPosition !== undefined) {
        // Use requestAnimationFrame to apply this after the DOM has updated
        requestAnimationFrame(() => {
          const newBookPosition = bookRef.current?.getBoundingClientRect()?.top;
          if (newBookPosition !== undefined) {
            // Calculate the difference after expanding/collapsing
            const positionDiff = newBookPosition - bookPosition;

            // Adjust scroll position to keep the book header in same relative position
            window.scrollTo({
              top: scrollPosition + positionDiff,
              behavior: "auto", // Use 'auto' instead of 'smooth' to prevent visible jumping
            });
          }
        });
      }
    },
    [isExpanded, notes.length, book.id, fetchNotes]
  );

  // Update the handleViewSummary function to improve the animation timing
  const handleViewSummary = useCallback(
    (noteId: string, e?: React.KeyboardEvent) => {
      // Handle keyboard events for accessibility
      if (e && e.key !== "Enter" && e.key !== " ") {
        return;
      }

      // Prevent space key from scrolling
      if (e && e.key === " ") {
        e.preventDefault();
      }

      setActiveNoteId(noteId);
    },
    []
  );

  const handleDeleteNote = async (noteId: string) => {
    setDeleteModal({ isOpen: true, type: "note", noteId, isLoading: false });
  };

  const handleConfirmDelete = async () => {
    if (!book.id) {
      toast.error("Nelze smazat knihu bez ID");
      setDeleteModal({ isOpen: false, type: "book", isLoading: false });
      return;
    }

    // Set loading state
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));

    try {
      // Call the onDelete function passed from the parent
      await onDelete(book.id);
      toast.success("Kniha byla úspěšně smazána");
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error("Nepodařilo se smazat knihu. Zkuste to prosím znovu.");
    } finally {
      setDeleteModal({ isOpen: false, type: "book", isLoading: false });
    }
  };

  const handleConfirmDeleteNote = async () => {
    if (deleteModal.type === "note" && deleteModal.noteId && book.id) {
      // Set loading state
      setDeleteModal((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await fetch(
          `/api/books/${book.id}/notes/${deleteModal.noteId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete note");
        }

        const data = await response.json();

        // Update the notes list with the returned data
        const formattedNotes = data.notes.map(
          (note: {
            _id: string;
            content: string;
            type: string;
            createdAt: string;
            updatedAt: string;
          }) => ({
            id: note._id,
            content: note.content,
            type: note.type,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
          })
        );

        // Update both the local notes state and the book state
        setNotes(formattedNotes);
        setBook((prevBook) => ({
          ...prevBook,
          notes: formattedNotes,
        }));

        toast.success("Poznámka byla úspěšně smazána");
      } catch (error: unknown) {
        console.error("Error deleting note:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Nepodařilo se smazat poznámku"
        );
      } finally {
        // Always close the delete modal, even if there was an error
        setDeleteModal({ isOpen: false, type: "book", isLoading: false });
      }
    } else {
      // Close the modal if the required IDs are missing
      setDeleteModal({ isOpen: false, type: "book", isLoading: false });
      showErrorMessage("Chybí ID poznámky nebo knihy");
    }
  };

  const handleGenerateSummary = async (
    preferencesToUse: SummaryPreferences
  ) => {
    // Check for feature access first
    if (!canAccess("aiAuthorSummary")) {
      // Do not allow generating if user doesn't have access
      toast.error("Pro generování shrnutí je potřeba alespoň Basic předplatné");
      setSummaryModal(false);
      return;
    }

    // Check for AI credits
    if (!hasAiCredits()) {
      setShowCreditExhaustedModal(true);
      setSummaryModal(false);
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookTitle: book.title,
          bookAuthor: book.author,
          bookId: book.id,
          preferences: preferencesToUse,
        }),
      });

      // Handle no credits response
      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.creditsRequired) {
          setShowCreditExhaustedModal(true);
          setSummaryModal(false);
          return;
        }
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate summary");
      }

      const data = await response.json();

      // Create a note object with only properties defined in the Note type
      const newNote: Note = {
        id: `ai-summary-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 11)}`,
        content: data.summary,
        createdAt: new Date().toISOString(),
        isAISummary: true,
      };

      // Handle notes array safely with proper type checking
      setBook((prev) => ({
        ...prev,
        notes: Array.isArray(prev.notes) ? [...prev.notes, newNote] : [newNote],
      }));

      // Add the note to the database
      try {
        const noteResponse = await fetch(`/api/books/${book.id}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: data.summary,
            isAISummary: true,
          }),
        });

        if (!noteResponse.ok) {
          console.error("Failed to save the generated summary to database");
        }
      } catch (noteError) {
        console.error("Error saving summary to database:", noteError);
      }

      setSummaryModal(false);
      toast.success("Shrnutí bylo úspěšně vygenerováno!");
      refreshAllSubscriptionData();
    } catch (error) {
      console.error("Error generating summary:", error);
      showErrorMessage(
        error instanceof Error
          ? error.message
          : "Nepodařilo se vygenerovat shrnutí. Zkuste to prosím znovu."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAuthorSummary = async (
    preferencesToUse: AuthorSummaryPreferences
  ) => {
    // Check for feature access first
    if (!canAccess("aiAuthorSummary")) {
      // Do not allow generating if user doesn't have access
      toast.error(
        "Pro generování informací o autorovi je potřeba alespoň Basic předplatné"
      );
      setAuthorSummaryModal(false);
      return;
    }

    // Check for AI credits
    if (!hasAiCredits()) {
      setShowCreditExhaustedModal(true);
      setAuthorSummaryModal(false);
      return;
    }

    setIsGeneratingAuthorSummary(true);

    try {
      const response = await fetch("/api/author-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author: book.author,
          bookId: book.id,
          preferences: preferencesToUse,
        }),
      });

      // Handle no credits response
      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.creditsRequired) {
          setShowCreditExhaustedModal(true);
          setAuthorSummaryModal(false);
          return;
        }
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate author summary");
      }

      const data = await response.json();

      // Update the book with the author summary and authorId
      setBook((prev) => ({
        ...prev,
        authorSummary: data.summary,
        authorId: data.authorId || prev.authorId,
      }));

      // Close the preferences modal
      setAuthorSummaryModal(false);

      // Show success message
      toast.success("Informace o autorovi byla úspěšně vygenerována!");

      // Refresh subscription data to update credit count
      refreshAllSubscriptionData();
    } catch (error) {
      console.error("Error generating author summary:", error);
      showErrorMessage(
        error instanceof Error
          ? error.message
          : "Nepodařilo se vygenerovat informace o autorovi. Zkuste to prosím znovu."
      );
    } finally {
      setIsGeneratingAuthorSummary(false);
    }
  };

  /**
   * Delete the author summary for the current book
   */
  const handleDeleteAuthorSummary = async () => {
    // Open the confirmation dialog
    setDeleteModal({ isOpen: true, type: "authorSummary", isLoading: false });
  };

  /**
   * Handle the confirmation of author summary deletion
   */
  const handleConfirmDeleteAuthorSummary = async () => {
    console.log("=== HANDLE CONFIRM DELETE AUTHOR SUMMARY CALLED ===");

    if (!book.id) {
      showErrorMessage("Nelze smazat informace o autorovi pro knihu bez ID");
      setDeleteModal({
        isOpen: false,
        type: "authorSummary",
        isLoading: false,
      });
      return;
    }

    if (!book.authorSummary) {
      showErrorMessage("Kniha nemá informace o autorovi ke smazání");
      setDeleteModal({
        isOpen: false,
        type: "authorSummary",
        isLoading: false,
      });
      return;
    }

    // Set loading state
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/books/${book.id}/authorSummary`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete author summary");
      }

      // Update the book state
      await response.json(); // Process response but no need to store the data
      setBook((prev) => ({
        ...prev,
        authorSummary: undefined,
      }));

      toast.success("Shrnutí autora bylo úspěšně smazáno");
    } catch (error: unknown) {
      console.error("Error deleting author summary:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Nepodařilo se smazat shrnutí autora"
      );
    } finally {
      // Reset the delete modal state
      setDeleteModal({
        isOpen: false,
        type: "authorSummary",
        isLoading: false,
      });
    }
  };

  // Update the handleBookDelete function
  const handleBookDelete = () => {
    // Check if the book has a valid ID (not a temporary one)
    if (!book.id || book.id.startsWith("temp-")) {
      console.error("Cannot delete book without a valid ID:", book);
      showErrorMessage(
        "Nelze smazat knihu bez platného ID. Zkuste obnovit stránku."
      );
      return;
    }

    // Use the deleteModal state instead of showDeleteConfirm
    setDeleteModal({
      isOpen: true,
      type: "book",
      isLoading: false,
    });
  };

  // Add a function to handle closing the summary with animation
  const handleCloseSummary = useCallback(() => {
    // Set activeNoteId to null directly without DOM manipulations
    setActiveNoteId(null);
  }, []);

  // Add a function to handle copying note content
  const handleCopyNote = (content: string, e?: React.MouseEvent) => {
    // Ensure event doesn't propagate
    if (e) {
      e.stopPropagation();
    }

    // Remove markdown formatting for a cleaner copy
    const plainText = content
      .replace(/#{1,6}\s+/g, "") // Remove headings
      .replace(/\*\*/g, "") // Remove bold
      .replace(/\*/g, "") // Remove italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // Replace links with just the text

    // Add haptic feedback if supported
    if (navigator.vibrate && window.innerWidth <= 768) {
      navigator.vibrate(3); // Very subtle vibration for feedback
    }

    navigator.clipboard
      .writeText(plainText)
      .then(() => {
        // Show success message
        showSuccessMessage("Text poznámky byl zkopírován do schránky");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        showErrorMessage("Nepodařilo se zkopírovat text");
      });
  };

  // Main rendering with the optimized structure
  return (
    <div
      ref={bookRef}
      className={`book-component rounded-lg overflow-hidden relative transition-all ease
                 ${
                   isExpanded
                     ? "shadow-lg bg-blue-950 border border-blue-800/70"
                     : "shadow-md hover:shadow-lg bg-gradient-to-b from-blue-950 to-blue-950/90 border border-blue-800/50"
                 }
                 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:ring-opacity-70`}
      style={{
        transitionDuration: "250ms",
      }}
    >
      {/* Book spine decoration only when not expanded */}
      {!isExpanded && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600/50 opacity-70"></div>
      )}

      {/* Book corner fold effect only when not expanded */}
      {!isExpanded && (
        <div className="absolute right-0 top-0 w-8 h-8 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-blue-900/30 shadow-inner transform rotate-45 translate-x-6 -translate-y-6"></div>
          <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-transparent to-blue-800/20 transform rotate-45 translate-x-4 -translate-y-4"></div>
        </div>
      )}

      {/* Book Header - now using the BookHeader component */}
      <BookHeader
        book={book}
        isExpanded={isExpanded}
        toggleExpanded={toggleExpanded}
        handleBookDelete={handleBookDelete}
        isAuthorInfoVisible={isAuthorInfoVisible}
        setAuthorSummaryModal={setAuthorSummaryModal}
        handleDeleteAuthorSummary={handleDeleteAuthorSummary}
        isGeneratingAuthorSummary={isGeneratingAuthorSummary}
        handleAuthorSummaryToggle={handleAuthorSummaryToggle}
      />

      {/* Author Info Panel */}
      <AnimatePresence mode="wait" onExitComplete={handleAnimationComplete}>
        {isAuthorInfoVisible && book.authorSummary && (
          <motion.div
            id={`author-${book.id}`}
            initial={{
              opacity: 0,
              height: 0,
              overflow: "hidden",
            }}
            animate={{
              opacity: 1,
              height: "auto",
              overflow: "visible",
            }}
            exit={{
              opacity: 0,
              height: 0,
              overflow: "hidden",
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className="relative w-full max-w-[800px] z-10 mx-auto my-4 overflow-hidden"
          >
            {/* Modern, flat card design with improved visual hierarchy */}
            <div className="bg-blue-950/40 rounded-xl shadow-lg overflow-hidden border border-blue-900/30">
              {/* Top accent line with animation */}
              <motion.div
                className="h-1 bg-gradient-to-r from-blue-400 to-blue-500 w-full"
                initial={{ scaleX: 0.7, opacity: 0.7 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
              ></motion.div>

              {/* Author header with portrait area - more modern and flat design */}
              <div className="px-5 py-4">
                <div className="flex items-start gap-4">
                  {/* Author portrait placeholder with subtle animation */}
                  <motion.div
                    className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-900/40 to-blue-800/20 flex items-center justify-center flex-shrink-0 border border-blue-800/50 shadow-sm"
                    initial={{ opacity: 0, scale: 0.9, rotateZ: -5 }}
                    animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <User className="h-8 w-8 text-blue-400" />
                  </motion.div>

                  {/* Author name and metadata with staggered animation */}
                  <div className="flex-1">
                    <motion.h2
                      className="text-xl font-medium text-blue-100"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15, duration: 0.3 }}
                    >
                      {book.author}
                    </motion.h2>
                    <motion.div
                      className="flex items-center mt-1"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      <span className="inline-flex items-center text-xs px-2 py-0.5 bg-blue-900/40 text-orange-300 rounded-full border border-blue-800/50">
                        <Sparkles className="h-3 w-3 mr-1 text-orange-400" />
                        AI generováno
                      </span>
                    </motion.div>

                    {/* Action buttons in header area with staggered animation */}
                    <motion.div
                      className="flex items-start space-x-3 mt-3"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25, duration: 0.3 }}
                    >
                      <div className="flex-shrink-0">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAuthorSummaryModal(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="text-orange-400 border-blue-800/50 hover:bg-blue-950/50 transition-all duration-200 text-xs py-1"
                        >
                          <Sparkles className="h-3 w-3 mr-1.5 text-orange-500" />
                          <span>Aktualizovat</span>
                        </Button>
                      </div>

                      <div className="flex-shrink-0">
                        <ExportButton
                          content={book.authorSummary}
                          filename={`${book.author}_info.md`}
                          buttonProps={{
                            variant: "outline",
                            size: "sm",
                            className:
                              "text-orange-400 border-blue-800/50 hover:bg-blue-950/50 transition-all text-xs py-1",
                          }}
                        />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Main content area with fade-in animation */}
              <motion.div
                className="px-5 py-4 border-t border-blue-900/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <div className="prose prose-invert max-w-none w-full prose-headings:text-orange-300 prose-headings:font-medium prose-strong:text-orange-200 prose-p:text-blue-100">
                  <StudyContent content={book.authorSummary} />
                </div>
              </motion.div>

              {/* Footer area with utilities - fade-in animation */}
              <motion.div
                className="border-t border-blue-900/30 bg-blue-950/50 px-5 py-3 flex justify-center items-center"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
              >
                <div className="flex items-center justify-center space-x-4 md:space-x-8">
                  <button
                    onClick={(e) => handleCopyNote(book.authorSummary || "", e)}
                    className="flex-shrink-0 text-xs px-3 py-1.5 rounded-md hover:bg-blue-800/30 text-blue-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Kopírovat</span>
                  </button>

                  <button
                    onClick={handleCloseAuthorInfo}
                    className="flex-shrink-0 text-xs bg-blue-800/30 hover:bg-blue-800/40 text-blue-200 py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Zavřít</span>
                  </button>

                  <button
                    onClick={handleDeleteAuthorSummary}
                    className="flex-shrink-0 text-xs px-3 py-1.5 rounded-md hover:bg-red-900/20 text-red-400 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Smazat</span>
                  </button>
                </div>
              </motion.div>

              {/* ESC key indicator with fade-in animation */}
              <motion.div
                className="w-full flex justify-center mt-2 mb-3"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <div className="bg-blue-950/50 px-2 py-0.5 rounded text-xs text-blue-200 flex items-center gap-1.5 shadow-sm border border-blue-900/30">
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-blue-800/40 rounded border border-blue-800/30 text-blue-200">
                    ESC
                  </kbd>
                  <span className="text-xs">pro zavření</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Content (Notes) */}
      <div
        id={`book-content-${book.id}`}
        className={`transition-all overflow-hidden
                   ${
                     isExpanded
                       ? "opacity-100 max-h-[5000px] p-3 sm:p-4 lg:p-5 space-y-4"
                       : "opacity-0 max-h-0 p-0 space-y-0"
                   }`}
        style={{
          transitionProperty: "max-height, opacity, padding",
          transitionTimingFunction: "ease",
          transitionDuration: isExpanded ? "350ms" : "200ms",
        }}
      >
        {/* Notes Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 pb-2 border-b border-blue-800/50">
          <h3 className="text-base sm:text-lg font-medium text-blue-100">
            Poznámky a shrnutí
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {/* Note Filter Buttons */}
            <div className="flex items-center bg-blue-950/40 rounded-md p-0.5 border border-blue-900/30">
              <button
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  activeNoteFilter === "all"
                    ? "bg-blue-800/40 text-blue-100 shadow-sm"
                    : "text-blue-300"
                }`}
                onClick={() => setActiveNoteFilter("all")}
              >
                Vše
              </button>
              <button
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  activeNoteFilter === "manual"
                    ? "bg-blue-800/40 text-blue-100 shadow-sm"
                    : "text-blue-300"
                }`}
                onClick={() => setActiveNoteFilter("manual")}
              >
                Moje
              </button>
              <button
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  activeNoteFilter === "ai"
                    ? "bg-orange-800/40 text-orange-100 shadow-sm"
                    : "text-blue-300"
                }`}
                onClick={() => setActiveNoteFilter("ai")}
              >
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-orange-400" />
                  AI
                </span>
              </button>
            </div>

            {/* Generate Summary Button */}
            <Button
              variant="outline"
              size="sm"
              className="text-orange-400 border-blue-900/50 hover:bg-blue-950/80 transition-all duration-200"
              onClick={() => setSummaryModal(true)}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5"></div>
                  <span>Generuji...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 text-orange-500" />
                  <span>Generovat shrnutí</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Notes List - now using the NotesList component */}
        {isExpanded && (
          <>
            {isLoadingNotes ? (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="relative mb-3">
                  <div className="w-8 h-8 border-2 border-blue-500/30 border-t-orange-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-blue-300 font-medium">Načítání...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <div className="relative w-20 h-20 mb-4">
                  <div className="absolute inset-0 bg-blue-900/30 rounded-lg shadow-inner flex items-center justify-center border border-blue-800/50">
                    <PenLine className="h-8 w-8 text-blue-400" />
                  </div>
                  <div className="absolute inset-0 animate-pulse opacity-70">
                    <div className="w-full h-full bg-blue-800 rounded-lg blur-xl"></div>
                  </div>
                </div>
                <p className="text-center text-blue-100 font-medium">
                  Zatím nemáte žádné poznámky k této knize
                </p>
                <p className="text-center text-blue-300 text-sm mt-1 max-w-md">
                  Přidejte poznámku pomocí formuláře níže nebo vygenerujte
                  shrnutí pomocí AI asistenta
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <NotesList
                  notes={notes}
                  activeNoteFilter={activeNoteFilter}
                  activeNoteId={activeNoteId}
                  handleDeleteNote={handleDeleteNote}
                  handleCopyNote={handleCopyNote}
                  handleViewSummary={handleViewSummary}
                  handleCloseSummary={handleCloseSummary}
                  bookTitle={book.title}
                />
              </div>
            )}

            {/* Add Note Form */}
            <div className="pt-4 border-t border-blue-900/30 mt-6">
              <div className="bg-blue-950/40 rounded-lg p-4 shadow-sm border border-blue-900/30">
                <NoteEditor
                  ref={textareaRef}
                  value={newNote}
                  onChange={setNewNote}
                  onSubmit={handleAddNote}
                  isSubmitting={isAddingNote}
                  placeholder="Přidejte poznámku k této knize..."
                  buttonText="Přidat poznámku"
                  className="w-full"
                />
              </div>
            </div>
          </>
        )}

        {/* Reference point for scrolling to the end of notes */}
        <div className="h-0 w-full" aria-hidden="true" />
      </div>

      {/* Error and Success Messages */}
      <AnimatePresence>
        {errorMessages.length > 0 && (
          <div className="p-4 space-y-2">
            {errorMessages.map((error, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-red-900/20 border border-red-800/30 rounded-md"
              >
                <div className="flex items-start sm:items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 sm:mt-0 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error.message}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successMessages.length > 0 && (
          <div className="p-4 space-y-2">
            {successMessages.map((success, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-green-900/20 border border-green-800/30 rounded-md"
              >
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-green-500 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <p className="text-sm text-green-400">{success.message}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Modals remain the same */}
      <ConfirmationDialog
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, type: "book", isLoading: false })
        }
        onConfirm={
          deleteModal.type === "book"
            ? handleConfirmDelete
            : deleteModal.type === "note"
            ? handleConfirmDeleteNote
            : handleConfirmDeleteAuthorSummary
        }
        title={
          deleteModal.type === "book"
            ? "Smazat knihu"
            : deleteModal.type === "note"
            ? "Smazat poznámku"
            : "Smazat informace o autorovi"
        }
        description={
          deleteModal.type === "book"
            ? `Opravdu chcete smazat knihu "${book.title}"? Tato akce je nevratná.`
            : deleteModal.type === "note"
            ? "Opravdu chcete smazat tuto poznámku? Tato akce je nevratná."
            : "Opravdu chcete smazat informace o autorovi? Tato akce je nevratná."
        }
        confirmText={
          deleteModal.type === "book"
            ? "Smazat knihu"
            : deleteModal.type === "note"
            ? "Smazat poznámku"
            : "Smazat informace o autorovi"
        }
        cancelText="Zrušit"
        isLoading={deleteModal.isLoading}
        variant="destructive"
      />

      <SummaryPreferencesModal
        isOpen={summaryModal}
        onClose={() => setSummaryModal(false)}
        onGenerate={handleGenerateSummary}
        isGenerating={isGenerating}
        title="Generovat shrnutí knihy"
        description="Vyberte preferovaný styl a zaměření shrnutí knihy."
      />

      <AuthorSummaryPreferencesModal
        isOpen={authorSummaryModal}
        onClose={() => setAuthorSummaryModal(false)}
        onGenerate={handleGenerateAuthorSummary}
        isGenerating={isGeneratingAuthorSummary}
        title="Generovat informace o autorovi"
        description="Vyberte preferovaný styl a zaměření informací o autorovi."
      />

      <Modal
        isOpen={showCreditExhaustedModal}
        onClose={() => setShowCreditExhaustedModal(false)}
        title="AI Kredity"
      >
        <AiCreditsExhaustedPrompt />
      </Modal>
    </div>
  );
}
