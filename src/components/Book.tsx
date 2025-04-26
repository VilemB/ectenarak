"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import React from "react";
import { Book, Note } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertCircle,
  Calendar,
  Copy,
  X,
  Trash2,
  ChevronDown,
  Sparkles,
  PenLine,
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
} from "./AuthorSummaryPreferencesModal";
import { NoteEditor } from "@/components/NoteEditor";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import AiCreditsExhaustedPrompt from "./AiCreditsExhaustedPrompt";
import { Modal } from "@/components/ui/modal";
import BookActionButtons from "./BookActionButtons";
import { useCompletion } from "@ai-sdk/react";

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
  // Create a reversed copy of the notes array for display
  const reversedNotes = useMemo(() => [...notes].reverse(), [notes]);

  // Filter the reversed notes
  const filteredNotes = reversedNotes.filter((note) => {
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
    <div
      className="space-y-4"
      data-no-toggle="true"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Map over the filtered and reversed notes */}
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
        <div className="prose prose-sm dark:prose-invert max-w-none relative prose-headings:text-blue-300 prose-strong:text-blue-200 prose-em:text-blue-300/90 prose-p:text-blue-100">
          <ReactMarkdown>{note.content.split("\n\n")[0]}</ReactMarkdown>
          {note.content.split("\n\n").length > 1 && (
            <div
              className="mt-2 text-blue-400 text-sm cursor-pointer hover:underline flex items-center gap-1.5 font-medium group"
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
          <div className="prose prose-sm dark:prose-invert max-w-none note-content text-blue-100">
            <ReactMarkdown
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              remarkPlugins={[remarkGfm]}
            >
              {note.content}
            </ReactMarkdown>
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
  showPremiumFeatureLock,
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
  showPremiumFeatureLock: boolean;
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
      title={
        isExpanded
          ? "Klikněte pro zavření (mimo tlačítka)"
          : "Klikněte pro rozbalení (mimo tlačítka)"
      }
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
              {book.authorSummary ? (
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
              ) : (
                showPremiumFeatureLock && (
                  <span className="relative ml-1">
                    {/* Remove PremiumFeatureLock from BookHeader */}
                  </span>
                )
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

                {/* Hide keyboard hint on smaller screens */}
                <span className="hidden sm:inline-flex text-xs ml-1 items-center text-zinc-400">
                  <kbd className="px-1 py-0.5 text-[10px] font-mono bg-blue-900/40 rounded border border-blue-800/50">
                    {isExpanded ? "ESC" : "Enter"}
                  </kbd>
                </span>
              </div>
            </div>
          </div>

          {/* Container for BookActionButtons - ensure it handles mobile correctly */}
          <div
            className="flex justify-start sm:justify-end mt-2 sm:mt-0 w-full sm:w-auto" // Added w-full sm:w-auto
            data-no-toggle="true"
            onClick={(e) => e.stopPropagation()}
          >
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
  // const { refreshSubscription } = useSubscription();
  // const { refreshSubscriptionData } = useSubscriptionContext();
  // Add useFeatureAccess hook
  const { canAccess, hasAiCredits } = useFeatureAccess();

  // Get the auth context properly
  const authContext = useAuth();
  const useAiCreditRef = useRef(authContext.useAiCredit);

  // Add global styles for notes
  useEffect(() => {
    // Create a style element for global note styles
    const styleEl = document.createElement("style");
    styleEl.type = "text/css";
    styleEl.appendChild(document.createTextNode(globalNoteStyles));
    document.head.appendChild(styleEl);

    // Clean up on unmount
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Update the ref if auth changes
  useEffect(() => {
    useAiCreditRef.current = authContext.useAiCredit;
  }, [authContext]);

  // Validate the book object
  const safeBook: Book = React.useMemo(() => {
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

  // Refs
  const bookRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Ref to store book preferences during generation
  const bookPreferencesRef = useRef<SummaryPreferences | null>(null);
  // Ref to store author preferences during generation
  const authorPreferencesRef = useRef<AuthorSummaryPreferences | null>(null);
  // Ref for the streaming completion container
  const streamingCompletionRef = useRef<HTMLDivElement>(null);

  // State
  const [book, setBook] = useState<Book>(safeBook);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [summaryModal, setSummaryModal] = useState(false);
  const [authorSummaryModal, setAuthorSummaryModal] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isAuthorInfoVisible, setIsAuthorInfoVisible] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "book" | "note" | "authorSummary";
    noteId?: string;
    isLoading: boolean;
  }>({ isOpen: false, type: "book", isLoading: false });
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

  // Create a more robust function for handling author summary toggling
  const handleAuthorSummaryToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (book.authorSummary) {
        setIsAuthorInfoVisible(!isAuthorInfoVisible);
      } else {
        // If no summary, open the modal to trigger generation
        setAuthorSummaryModal(true);
      }
    },
    [book.authorSummary, isAuthorInfoVisible]
  );

  // Memoize access checks for better performance
  const hasAuthorSummarySubscription = React.useMemo(
    () => canAccess("aiAuthorSummary"),
    [canAccess]
  );
  const userHasAiCredits = React.useMemo(() => hasAiCredits(), [hasAiCredits]);
  // We removed the featureLoading useMemo since it's no longer needed

  // Add missing check for AI Customization subscription
  const hasAiCustomizationSubscription = React.useMemo(
    () => canAccess("aiCustomization"),
    [canAccess]
  );

  // Helper function for handling feature access
  const handleFeatureAction = useCallback(
    (
      feature: "aiAuthorSummary" | "aiCustomization" | "exportToPdf",
      hasSubscription: boolean,
      action: () => void,
      isButtonGenerating: boolean
    ) => {
      // Don't do anything if the button is in loading or generating state
      if (isButtonGenerating) {
        return;
      }

      if (feature === "exportToPdf") {
        // For export feature, check subscription
        if (hasSubscription) {
          // Execute the action
          action();
        } else {
          // Show subscription modal if user doesn't have subscription
          window.dispatchEvent(
            new CustomEvent("show-subscription-modal", {
              detail: {
                feature,
                needsCredits: false,
              },
            })
          );
        }
      } else {
        // For AI features, just execute the action
        // The modals will handle credit/subscription checks internally
        action();
      }
    },
    []
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

  // Hook for Book Summary
  const {
    complete: bookComplete,
    isLoading: isBookLoading,
    completion: bookCompletion,
  } = useCompletion({
    api: "/api/generate-summary",
    onFinish: async (_prompt, completionText) => {
      console.log(
        "bookCompletion: onFinish triggered with text length:",
        completionText?.length ?? 0
      );
      const prefs = bookPreferencesRef.current;
      if (!prefs) {
        console.error(
          "useCompletion: onFinish Error - Book Preferences ref was null."
        );
        toast.error(
          "Chyba při ukládání shrnutí knihy: Chybějící nastavení (ref)."
        );
        bookPreferencesRef.current = null;
        return;
      }

      // --- Save the completed summary via API ---
      if (!book.id || !completionText) {
        toast.error("Chyba: Chybí ID knihy nebo obsah shrnutí pro uložení.");
        bookPreferencesRef.current = null;
        return;
      }

      try {
        console.log(`Saving AI summary for book ${book.id}...`);
        const response = await fetch(`/api/books/${book.id}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: completionText, // The generated summary text
            isAISummary: true, // Flag indicating it's an AI summary
            // Optionally include preferences if the backend needs them
            // preferences: prefs,
          }),
        });

        if (!response.ok) {
          let errorMsg = "Nepodařilo se uložit AI shrnutí.";
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch {
            // Ignore if response is not JSON - removed unused jsonError variable
          }
          throw new Error(errorMsg);
        }

        // API should return the updated notes list including the new one
        const data = await response.json();

        // Format the notes from the response (ensure consistent formatting)
        const formattedNotes = data.notes.map(
          (note: {
            _id: string;
            content: string;
            createdAt: string;
            isAISummary?: boolean;
          }) => ({
            id: note._id,
            content: note.content,
            createdAt: new Date(note.createdAt).toISOString(),
            isAISummary: note.isAISummary || false,
          })
        );

        // Update the notes state with the list from the backend
        setNotes(formattedNotes);

        // Update the book state as well if necessary
        setBook((prevBook) => ({
          ...prevBook,
          notes: formattedNotes,
          updatedAt: new Date().toISOString(),
        }));

        // Show success toast
        toast.success("AI shrnutí bylo úspěšně vygenerováno a uloženo!");

        // Trigger credit refresh in UI
        window.dispatchEvent(new CustomEvent("refresh-credits"));

        // Find the newly added note ID from the response for scrolling
        const newNoteId = formattedNotes.find(
          (note: Note) => note.content === completionText && note.isAISummary
        )?.id;

        if (newNoteId) {
          scrollToNewlyAddedNote(newNoteId);
        } else {
          console.warn(
            "Could not find newly added AI note in API response for scrolling."
          );
        }

        // Set filter to show AI notes if not already visible
        if (activeNoteFilter === "manual") {
          setActiveNoteFilter("ai");
        } else if (activeNoteFilter === "all") {
          // Keep 'all' filter
        } else {
          setActiveNoteFilter("ai"); // Default to AI filter if current is 'ai'
        }
      } catch (error: unknown) {
        // Use unknown type for caught error
        console.error("Error saving AI summary via API:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Neznámá chyba";
        toast.error(`Chyba při ukládání AI shrnutí: ${errorMessage}`);
      } finally {
        // --- End logic ---
        bookPreferencesRef.current = null; // Clear ref on success/error
      }
    },
    onError: (err: Error) => {
      // Specify Error type for err parameter
      console.error("bookCompletion: onError triggered:", err);
      const message =
        err.message || "Nastala chyba při generování shrnutí knihy";
      toast.error(message);

      // Check if error is related to credits
      if (
        message.includes("403") ||
        message.toLowerCase().includes("credit") ||
        message.toLowerCase().includes("insufficient")
      ) {
        // Dispatch event or show modal directly
        setShowCreditExhaustedModal(true);
        console.log("Showing credit exhausted modal due to error:", message);
      }

      bookPreferencesRef.current = null; // Clear correct ref on error
    },
  });

  // Hook for Author Summary
  const {
    complete: authorComplete,
    isLoading: isAuthorLoading,
    completion: authorCompletion,
  } = useCompletion({
    api: "/api/author-summary",
    onFinish: (_prompt, completionText) => {
      console.log(
        "[Book.tsx:AuthorOnFinish] START. Text length:",
        completionText?.length ?? 0
      );
      authorPreferencesRef.current = null; // Clear ref
      try {
        console.log("[Book.tsx:AuthorOnFinish] Updating local book state...");

        // Update state in multiple stages to ensure reactivity
        // First update the local state
        setBook((prevBook) => {
          const newState = {
            ...prevBook,
            authorSummary: completionText,
            updatedAt: new Date().toISOString(),
          };
          console.log(
            "[Book.tsx:AuthorOnFinish] New local book state prepared:",
            newState
          );
          return newState;
        });

        console.log(
          "[Book.tsx:AuthorOnFinish] Local book state update requested."
        );

        // Ensure this change is reflected before updating the UI
        setTimeout(() => {
          console.log(
            "[Book.tsx:AuthorOnFinish] Updating UI state (visibility, modal)..."
          );
          setIsAuthorInfoVisible(true); // Keep author info panel open
          setAuthorSummaryModal(false); // Close the preferences modal
          console.log("[Book.tsx:AuthorOnFinish] UI state updated.");

          console.log(
            "[Book.tsx:AuthorOnFinish] Dispatching credit refresh event..."
          );
          window.dispatchEvent(new CustomEvent("refresh-credits"));
          console.log(
            "[Book.tsx:AuthorOnFinish] Credit refresh event dispatched."
          );

          console.log("[Book.tsx:AuthorOnFinish] Showing success toast...");
          toast.success(
            "Informace o autorovi byly úspěšně vygenerovány a uloženy!"
          );
          console.log("[Book.tsx:AuthorOnFinish] Success toast shown.");

          // Force refresh of author data from server
          fetch(`/api/authors/${encodeURIComponent(book.author)}`)
            .then((res) => res.json())
            .then((authorData) => {
              if (authorData.summary) {
                console.log(
                  "[Book.tsx:AuthorOnFinish] Retrieved author data from API, updating local state with fresh data."
                );
                setBook((prevBook) => ({
                  ...prevBook,
                  authorSummary: authorData.summary,
                }));
              }
              // Dispatch the update event to refresh the parent component
              console.log(
                "[Book.tsx:AuthorOnFinish] Dispatching author-summary-updated event..."
              );
              window.dispatchEvent(new CustomEvent("author-summary-updated"));
              console.log(
                "[Book.tsx:AuthorOnFinish] author-summary-updated event dispatched."
              );
            })
            .catch((err) => {
              console.error(
                "[Book.tsx:AuthorOnFinish] Error fetching fresh author data:",
                err
              );
              // Still dispatch event to refresh parent component
              window.dispatchEvent(new CustomEvent("author-summary-updated"));
            });
        }, 100);
      } catch (error) {
        console.error(
          "[Book.tsx:AuthorOnFinish] !!! Error within onFinish callback:",
          error
        );
        // Use a different variable name here
        const finishErrorMsg =
          error instanceof Error ? error.message : "Neznámá chyba";
        toast.error(`Chyba při zpracování (onFinish): ${finishErrorMsg}`);
      }
      console.log("[Book.tsx:AuthorOnFinish] END.");
    },
    onError: (err: Error) => {
      console.error("[Book.tsx:AuthorOnError] START Error triggered:", err);
      authorPreferencesRef.current = null; // Clear ref on error
      try {
        const message =
          err.message || "Nastala chyba při generování informací o autorovi";
        console.log("[Book.tsx:AuthorOnError] Showing error toast:", message);
        toast.error(message);
        console.log("[Book.tsx:AuthorOnError] Closing modal...");
        setAuthorSummaryModal(false);
        console.log("[Book.tsx:AuthorOnError] Checking for credit issue...");
        if (
          message.includes("403") ||
          message.toLowerCase().includes("credit") ||
          message.toLowerCase().includes("insufficient")
        ) {
          console.log(
            "[Book.tsx:AuthorOnError] Credit issue detected, showing modal."
          );
          setShowCreditExhaustedModal(true);
        }
      } catch (error) {
        console.error(
          "[Book.tsx:AuthorOnError] !!! Error within onError callback:",
          error
        );
        // Use a different variable name here
        const onErrorErrorMsg =
          error instanceof Error ? error.message : "Neznámá chyba";
        toast.error(`Chyba při zpracování chyby (onError): ${onErrorErrorMsg}`);
      }
      console.log("[Book.tsx:AuthorOnError] END.");
    },
  });

  // Update handleGenerateSummary to use the hook
  const handleGenerateSummary = async (preferences: SummaryPreferences) => {
    console.log(
      "handleGenerateSummary: Setting book preferences ref:",
      preferences
    );
    bookPreferencesRef.current = preferences; // Use bookPreferencesRef
    // const { user } = authContext; // Remove unused variable

    try {
      // ... checks ...

      console.log(
        "handleGenerateSummary: Checks passed, calling complete(). Prefs stored in ref:",
        bookPreferencesRef.current // Use bookPreferencesRef
      );
      await bookComplete("", {
        // Prompt is handled by API
        body: {
          bookTitle: book.title,
          bookAuthor: book.author,
          notes: notes
            .filter((n) => !n.isAISummary)
            .map((note) => note.content)
            .join("\n\n"),
          preferences, // Pass preferences to the API body
        },
      });
      console.log(
        "handleGenerateSummary: complete() call finished without throwing sync error."
      );
    } catch (error) {
      console.error(
        "handleGenerateSummary: Error during setup or complete() call:",
        error
      );
      toast.error("Nepodařilo se spustit generování shrnutí.");
      bookPreferencesRef.current = null; // Clear ref on setup error
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

  // Add ESC key handler to close the book
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        // Only handle ESC if we're not in an active note view
        if (!activeNoteId) {
          toggleExpanded();
        } else {
          // If a note is active, close that first
          handleCloseSummary();
        }
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isExpanded, activeNoteId, toggleExpanded, handleCloseSummary]);

  // Add an event listener for the show-credit-exhausted-modal event
  useEffect(() => {
    const handleShowCreditExhaustedModal = () => {
      setShowCreditExhaustedModal(true);
    };

    window.addEventListener(
      "show-credit-exhausted-modal",
      handleShowCreditExhaustedModal
    );

    return () => {
      window.removeEventListener(
        "show-credit-exhausted-modal",
        handleShowCreditExhaustedModal
      );
    };
  }, []);

  // Function to validate feature access for all features at once
  // This prevents checking feature access for each button individually
  const validateFeatureAccess = useCallback(
    async (bookId: string) => {
      if (!bookId) return;

      // Pre-validate all features at once
      const hasAuthorSummaryAccess = canAccess("aiAuthorSummary");
      const hasAiCustomizationAccess = canAccess("aiCustomization");
      const hasExportAccess = canAccess("exportToPdf");
      const aiCreditsAvailable = hasAiCredits();

      // No need to make API calls, just store results in memory
      console.log(`Book ${bookId} feature access validated`, {
        aiAuthorSummary: hasAuthorSummaryAccess && aiCreditsAvailable,
        aiCustomization: hasAiCustomizationAccess && aiCreditsAvailable,
        exportToPdf: hasExportAccess,
      });
    },
    [canAccess, hasAiCredits]
  );

  // Validate feature access when the book changes
  useEffect(() => {
    if (book.id) {
      validateFeatureAccess(book.id);
    }
  }, [book.id, validateFeatureAccess]);

  // Handle deleting the author summary
  const handleDeleteAuthorSummary = () => {
    // Open the delete confirmation modal
    setDeleteModal({
      isOpen: true,
      type: "authorSummary",
      isLoading: false,
    });
  };

  // Handle confirming the deletion of the author summary
  const handleConfirmDeleteAuthorSummary = async () => {
    // ... (existing logic to clear local book state) ...
    setBook((prev) => ({ ...prev, authorSummary: undefined }));
    setIsAuthorInfoVisible(false);
    toast.success("Shrnutí autora bylo úspěšně smazáno (lokálně).");
    setDeleteModal({ isOpen: false, type: "authorSummary", isLoading: false });
    // TODO: Optionally call a DELETE endpoint if you want to clear the Author model cache
  };

  // Scroll to streaming container when loading starts
  useEffect(() => {
    if (isLoadingNotes && streamingCompletionRef.current) {
      // Use setTimeout to ensure the element is rendered before scrolling
      setTimeout(() => {
        streamingCompletionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest", // Try 'nearest' or 'center' if 'start' scrolls too much
        });
      }, 100); // Small delay
    }
  }, [isLoadingNotes]); // Dependency array ensures this runs when isLoading changes

  // Update handleGenerateAuthorSummary to use the new hook
  const handleGenerateAuthorSummary = async (
    preferencesToUse: AuthorSummaryPreferences
  ) => {
    console.log(
      "handleGenerateAuthorSummary: Setting author preferences ref:",
      preferencesToUse
    );
    authorPreferencesRef.current = preferencesToUse; // Store actual prefs in authorPreferencesRef
    // const { user } = authContext; // Still potentially unused depending on checks

    try {
      // ... checks ...

      console.log(
        "handleGenerateAuthorSummary: Checks passed, calling complete(). Prefs stored in ref:",
        authorPreferencesRef.current
      );
      await authorComplete("", {
        // Call authorComplete
        body: {
          author: book.author,
          preferences: preferencesToUse, // Pass the parameter here
          forceRefresh: true, // Always force refresh to ensure new generation
        },
      });
      console.log(
        "handleGenerateAuthorSummary: authorComplete() call finished without throwing sync error."
      );

      // After generation is complete, manually fetch and update the author summary from the database
      try {
        // Short delay to ensure the database has been updated
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Fetch the author data directly
        const authorResponse = await fetch(
          `/api/authors/${encodeURIComponent(book.author)}`
        );
        if (authorResponse.ok) {
          const authorData = await authorResponse.json();
          if (authorData.summary) {
            console.log(
              "Fetched updated author summary from API, length:",
              authorData.summary.length
            );

            // Update the book data with the fetched summary
            setBook((prevBook) => ({
              ...prevBook,
              authorSummary: authorData.summary,
            }));
          }
        }
      } catch (fetchError) {
        console.error("Error fetching updated author summary:", fetchError);
        // We don't show an error to the user here since the generation itself succeeded
      }
    } catch (error) {
      console.error(
        "handleGenerateAuthorSummary: Error during setup or authorComplete() call:",
        error
      );
      toast.error("Nepodařilo se spustit generování informací o autorovi.");
      authorPreferencesRef.current = null; // Clear author ref on setup error
    }
  };

  // Main rendering with the optimized structure
  console.log(
    "[Book.tsx Render] Rendering BookComponent for:",
    initialBook?.title,
    "Current book state:",
    book
  );
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
        isGeneratingAuthorSummary={isAuthorLoading}
        handleAuthorSummaryToggle={handleAuthorSummaryToggle}
        showPremiumFeatureLock={!hasAuthorSummarySubscription}
      />

      {/* Author Info Panel - Updated Rendering Logic */}
      <AnimatePresence mode="wait" onExitComplete={handleAnimationComplete}>
        {
          /* Log using IIFE */
          (() => {
            console.log(
              "[Book.tsx Render] Checking author panel condition: isVisible:",
              isAuthorInfoVisible,
              "hasSummary:",
              !!book.authorSummary,
              "isLoading:",
              isAuthorLoading
            );
            return null; // Return null for React
          })()
        }
        {isAuthorInfoVisible && (book.authorSummary || isAuthorLoading) && (
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
            <div className="bg-blue-950/40 rounded-xl shadow-lg overflow-hidden border border-blue-900/30">
              {/* ... Top accent line ... */}
              {/* ... Author header (User icon, name) ... */}

              {/* Conditional Content Area */}
              {isAuthorLoading ? (
                <motion.div
                  className="px-5 py-4 border-t border-blue-900/30 min-h-[150px] flex flex-col justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  {/* Loading state with streaming text */}
                  <div className="flex items-center gap-2 mb-3 text-orange-400">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    <span className="text-xs font-medium">
                      Generuji informace o autorovi...
                    </span>
                  </div>
                  <div className="prose prose-sm prose-invert max-w-none note-content text-blue-100/80">
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw]}
                      remarkPlugins={[remarkGfm]}
                    >
                      {authorCompletion || ""}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ) : (
                book.authorSummary && (
                  <motion.div
                    className="px-5 py-4 border-t border-blue-900/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    {/* Render final summary */}
                    {
                      /* Log using IIFE */
                      (() => {
                        console.log(
                          "[Book.tsx Render] Rendering author summary content:",
                          book.authorSummary
                        );
                        return null; // Return null for React
                      })()
                    }
                    <div className="prose prose-invert max-w-none w-full prose-headings:text-orange-300 prose-headings:font-medium prose-strong:text-orange-200 prose-p:text-blue-100">
                      <StudyContent content={book.authorSummary} />
                    </div>
                  </motion.div>
                )
              )}

              {/* Footer area with utilities */}
              {/* Only show footer when not loading or if summary exists */}
              {(!isAuthorLoading || book.authorSummary) && (
                <motion.div
                  className="border-t border-blue-900/30 bg-blue-950/80 px-5 py-4 flex justify-between items-center"
                  // ... animation props ...
                >
                  {/* ... Copy, Delete buttons ... */}
                  <div className="flex items-center gap-2">
                    {/* Update Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeatureAction(
                          "aiAuthorSummary",
                          hasAuthorSummarySubscription,
                          () => setAuthorSummaryModal(true), // Open modal to confirm/set prefs
                          isAuthorLoading
                        );
                      }}
                      disabled={isAuthorLoading} // Use correct loading state
                      className="h-8 text-xs bg-orange-900/30 border-orange-800/50 hover:bg-orange-900/50 text-orange-400 rounded-md"
                    >
                      {isAuthorLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5"></div>
                          <span>Aktualizuji...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 mr-1.5 text-orange-400" />
                          <span>
                            {book.authorSummary ? "Aktualizovat" : "Generovat"}
                          </span>
                        </>
                      )}
                    </Button>
                    {/* ... Lock indicator ... */}
                    {/* ... Close Button ... */}
                  </div>
                </motion.div>
              )}
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
        {/* Notes Section Header - Ensure vertical stacking on smallest screens */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2 pt-4 pb-3 border-b border-blue-800/50">
          <h3 className="text-base font-medium text-blue-100">
            Poznámky a shrnutí
          </h3>
          {/* Container for buttons - Stacks vertically by default */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {/* Note Filter Buttons */}
            <div
              className="flex items-center bg-blue-950/40 rounded-md p-0.5 border border-blue-900/30"
              data-no-toggle="true"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  activeNoteFilter === "all"
                    ? "bg-blue-800/40 text-blue-100 shadow-sm"
                    : "text-blue-300"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveNoteFilter("all");
                }}
              >
                Vše
              </button>
              <button
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  activeNoteFilter === "manual"
                    ? "bg-blue-800/40 text-blue-100 shadow-sm"
                    : "text-blue-300"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveNoteFilter("manual");
                }}
              >
                Moje
              </button>
              <button
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  activeNoteFilter === "ai"
                    ? "bg-orange-800/40 text-orange-100 shadow-sm"
                    : "text-blue-300"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveNoteFilter("ai");
                }}
              >
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-orange-400" />
                  AI
                </span>
              </button>
            </div>

            {/* Generate Summary Button */}
            <div
              className="relative"
              data-no-toggle="true"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto bg-orange-950/30 border-orange-800/50 transition-all duration-200 text-xs py-1 rounded-md text-orange-400 hover:bg-orange-900/30 hover:text-orange-400 cursor-pointer"
                disabled={isBookLoading} // Use isLoading from the hook
                onClick={(e) => {
                  e.stopPropagation();
                  handleFeatureAction(
                    "aiCustomization",
                    hasAiCustomizationSubscription,
                    () => setSummaryModal(true),
                    isBookLoading // Pass isLoading state
                  );
                }}
              >
                {isBookLoading ? ( // Use isLoading from the hook
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5"></div>
                    <span>Generuji...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 text-orange-400" />
                    <span>Generovat shrnutí</span>
                  </>
                )}
              </Button>
              {/* Lock indicator for AI Summary */}
              {(!hasAiCustomizationSubscription ||
                (hasAiCustomizationSubscription && !userHasAiCredits)) &&
                !isBookLoading && (
                  <span>{/* Lock removed - Placeholder */}</span>
                )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <>
            {isLoadingNotes ? (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="relative mb-3">
                  <div className="w-8 h-8 border-2 border-blue-500/30 border-t-orange-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-blue-300 font-medium">Načítání...</p>
              </div>
            ) : (
              <div
                className="space-y-4"
                data-no-toggle="true"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Render streaming completion text FIRST when loading */}
                {isBookLoading && ( // Use isBookLoading from the correct hook
                  <motion.div
                    ref={streamingCompletionRef} // Assign the ref
                    initial={{ opacity: 0.5, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-background rounded-lg p-3 sm:p-4 border border-orange-800/50 shadow-sm opacity-90"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-orange-500 animate-pulse" />
                      <span className="text-xs text-orange-400">
                        Generuji AI Shrnutí...
                      </span>
                      <div className="w-full h-1 bg-orange-900/30 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-orange-500 animate-pulse rounded-full"
                          style={{ width: "50%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none note-content text-blue-100/80">
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw, rehypeSanitize]}
                        remarkPlugins={[remarkGfm]}
                      >
                        {bookCompletion || ""}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                )}

                {/* Render existing notes (now uses reversed list internally) */}
                {(!isBookLoading || !bookCompletion) && (
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
                )}
              </div>
            )}

            {/* Add Note Form */}
            <div
              className="pt-4 border-t border-blue-900/30 mt-6"
              data-no-toggle="true"
              onClick={(e) => e.stopPropagation()}
            >
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
        onGenerate={handleGenerateSummary} // Pass the updated handler
        isGenerating={isBookLoading} // Use isLoading from the hook
        title="Generovat shrnutí knihy"
        description="Vyberte preferovaný styl a zaměření shrnutí knihy."
      />

      <AuthorSummaryPreferencesModal
        isOpen={authorSummaryModal}
        onClose={() => setAuthorSummaryModal(false)}
        onGenerate={handleGenerateAuthorSummary} // Passing the correct function reference
        isGenerating={isAuthorLoading}
        title={
          book.authorSummary
            ? "Aktualizovat informace o autorovi"
            : "Generovat informace o autorovi"
        }
        description="Vyberte preferovaný styl a zaměření informací o autorovi."
        authorSummaryExists={!!book.authorSummary}
      />

      {/* AI Credits Exhausted Modal */}
      <Modal
        isOpen={showCreditExhaustedModal}
        onClose={() => setShowCreditExhaustedModal(false)}
        title="AI Kredity"
      >
        <AiCreditsExhaustedPrompt
          onClose={() => setShowCreditExhaustedModal(false)}
          feature="aiSummary"
        />
      </Modal>
    </div>
  );
}

// Add global styles for notes
const globalNoteStyles = `
  .note-content {
    line-height: 1.6;
    font-size: 0.95rem;
    letter-spacing: 0.01em;
    color: #bfdbfe; /* Adding explicit text color (blue-100) */
  }
  
  .note-content p {
    margin-bottom: 1em;
    color: #bfdbfe; /* blue-100 */
  }
  
  .note-content h1, .note-content h2, .note-content h3, .note-content h4 {
    color: #dbeafe; /* blue-50 */
    font-weight: 600;
  }
  
  .note-content ul, .note-content ol {
    color: #bfdbfe; /* blue-100 */
  }
  
  .note-content li {
    color: #bfdbfe; /* blue-100 */
  }
  
  .note-content img {
    max-width: 100%;
    border-radius: 0.25rem;
    margin: 1em 0;
  }
  
  .note-content code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #93c5fd; /* blue-300 */
    background-color: rgba(30, 41, 59, 0.5); /* slate-800 with opacity */
    padding: 0.1em 0.3em;
    border-radius: 0.25rem;
  }
  
  .note-content a {
    color: #60a5fa;
    text-decoration: underline;
    transition: color 0.15s ease;
  }
  
  .note-content a:hover {
    color: #93c5fd;
  }
  
  .note-content blockquote {
    border-left: 3px solid #3b82f6; /* blue-500 */
    padding-left: 1em;
    font-style: italic;
    color: #93c5fd; /* blue-300 */
    margin: 1em 0;
  }
`;
