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

// Study-friendly content formatter component
const StudyContent = ({ content }: { content: string }) => {
  return (
    <div className="study-summary">
      <div
        className="prose prose-amber prose-sm md:prose dark:prose-invert 
                   prose-headings:mt-6 prose-headings:mb-3 prose-headings:font-bold prose-headings:text-amber-800 dark:prose-headings:text-amber-300 
                   prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                   prose-p:my-3 prose-p:text-sm md:prose-p:text-base prose-p:leading-relaxed
                   prose-li:ml-4 prose-li:my-1
                   prose-strong:text-amber-700 dark:prose-strong:text-amber-400
                   prose-em:text-amber-600 dark:prose-em:text-amber-300
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
        className="bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-700 dark:text-amber-300 h-7 w-7 p-0 rounded-full shadow-sm border border-amber-200/70 dark:border-amber-800/70 transition-all duration-200"
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
    className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-950/50 transition-all duration-200"
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
    className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1.5 transition-colors"
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
    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
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
      <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-border/40">
        <p>Žádné poznámky odpovídající vybranému filtru.</p>
        {activeNoteFilter !== "all" && (
          <p className="text-sm mt-1">
            Zkuste změnit filtr nebo přidat novou poznámku.
          </p>
        )}
      </div>
    );
  }

  return (
    <AnimatePresence initial={false}>
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
    </AnimatePresence>
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
    <AnimatePresence mode="wait">
      {isActive ? (
        <motion.div
          key="expanded-summary"
          initial={{
            opacity: 0,
            height: 0,
            overflow: "hidden",
            transformOrigin: "top center",
          }}
          animate={{
            opacity: 1,
            height: "auto",
            overflow: "visible",
            scale: 1,
          }}
          exit={{
            opacity: 0,
            height: 0,
            overflow: "hidden",
            scale: 0.98,
            transition: {
              opacity: { duration: 0.15, ease: "easeOut" },
              height: { duration: 0.25, ease: [0.32, 0.72, 0, 1] },
              scale: { duration: 0.2 },
            },
          }}
          transition={{
            opacity: { duration: 0.3, ease: "easeIn" },
            height: { duration: 0.35, ease: [0.65, 0, 0.35, 1] },
            scale: {
              duration: 0.3,
              type: "spring",
              stiffness: 400,
              damping: 30,
            },
          }}
          className="relative bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 rounded-lg p-4 mt-2 border border-amber-200/50 dark:border-amber-800/30 shadow-inner w-[95%] max-w-[650px] z-10 mx-auto my-4"
        >
          {/* Close button - positioned absolutely in the top-right corner */}
          <CloseButtonTop
            onClick={onClose}
            label="Zavřít shrnutí knihy"
            title="Zavřít shrnutí knihy (ESC)"
          />

          {/* ESC key indicator */}
          <div className="flex justify-between items-start mb-5">
            <div></div> {/* Empty div for spacing */}
            <motion.div
              className="hidden sm:flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/70 shadow-sm"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.2 }}
              whileHover={{
                scale: 1.03,
                backgroundColor: "rgba(251, 191, 36, 0.2)",
                borderColor: "rgba(251, 191, 36, 0.3)",
              }}
            >
              <kbd className="px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-200 dark:bg-amber-800 rounded border border-amber-300 dark:border-amber-700 shadow-sm">
                ESC
              </kbd>
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                zavřít panel
              </span>
            </motion.div>
          </div>

          {/* Study-friendly content */}
          <div className="prose prose-sm md:prose dark:prose-invert max-w-none w-full px-2 sm:px-4 py-2">
            <StudyContent content={note.content} />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.2 }}
            className="mt-6 pt-4 border-t border-amber-200/50 dark:border-amber-800/30 flex justify-between items-center"
          >
            <div className="flex items-center gap-4">
              <CopyButton
                onClick={(e) => onCopy(note.content, e)}
                text="Kopírovat text"
              />
              <DeleteButton
                onClick={() => onDelete(note.id)}
                text="Smazat shrnutí"
              />
            </div>

            <CloseButtonBottom onClick={onClose} text="Zavřít shrnutí" />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="collapsed-summary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="prose prose-amber prose-sm dark:prose-invert max-w-none relative"
        >
          <ReactMarkdown>{note.content.split("\n\n")[0]}</ReactMarkdown>
          {note.content.split("\n\n").length > 1 && (
            <motion.div
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="mt-2 text-amber-600 dark:text-amber-400 text-sm cursor-pointer hover:underline flex items-center gap-1.5 font-medium group"
              onClick={() => onView(note.id)}
              onKeyDown={(e) => onView(note.id, e)}
              tabIndex={0}
              role="button"
              aria-expanded={isActive}
              aria-controls={`expanded-summary-${note.id}`}
            >
              <span>Zobrazit celé shrnutí</span>
              <ChevronDown className="h-3.5 w-3.5 group-hover:translate-y-0.5 transition-transform duration-200" />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
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
    <motion.div
      key={note.id}
      id={`note-${note.id}`}
      className={`bg-background rounded-lg p-3 sm:p-4 border border-border/60 ${
        isActive ? "ring-1 ring-primary/20" : ""
      } transition-all duration-200 hover:border-border/80 hover:shadow-sm`}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isActive ? 1.01 : 1,
        boxShadow: isActive
          ? "0 4px 12px rgba(0,0,0,0.08)"
          : "0 1px 3px rgba(0,0,0,0.05)",
      }}
      exit={{ opacity: 0, y: -5 }}
      transition={{
        duration: 0.25,
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      whileHover={{ y: -1 }}
    >
      {/* Note Header */}
      <div className="flex flex-wrap items-start justify-between mb-2">
        <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-0">
          {note.isAISummary ? (
            <Sparkles className="h-4 w-4 text-amber-500" />
          ) : (
            <PenLine className="h-4 w-4 text-muted-foreground" />
          )}
          <span
            className={`text-xs ${
              note.isAISummary
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
            }`}
          >
            {note.isAISummary ? "AI Shrnutí" : "Moje poznámka"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(note.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {note.isAISummary && (
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <ExportButton
                content={note.content}
                filename={`${bookTitle}_shrnutí.md`}
                buttonProps={{
                  variant: "ghost",
                  size: "sm",
                  className:
                    "h-7 w-7 p-0 text-muted-foreground hover:text-foreground",
                }}
              />
            </motion.div>
          )}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => onView(note.id)}
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="sr-only">Zobrazit shrnutí</span>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(note.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Smazat poznámku</span>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Note Content */}
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
    </motion.div>
  );
};

// Create a separate component for the book header with improved expand/collapse interaction
const BookHeader = ({
  book,
  isExpanded,
  toggleExpanded,
  handleBookDelete,
  setIsAuthorInfoVisible,
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
  setIsAuthorInfoVisible: (visible: boolean) => void;
  isAuthorInfoVisible: boolean;
  setAuthorSummaryModal: (open: boolean) => void;
  handleDeleteAuthorSummary: () => void;
  isGeneratingAuthorSummary: boolean;
  handleAuthorSummaryToggle: (e: React.MouseEvent) => void;
}) => {
  return (
    <motion.div
      className={`p-3 sm:p-4 cursor-pointer transition-all duration-250 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] ${
        isExpanded ? "border-b border-border/40" : ""
      } ${
        isExpanded ? "bg-black/[0.01] dark:bg-white/[0.01]" : ""
      } relative group`}
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
      whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
      whileTap={{ scale: 0.998 }}
      transition={{ duration: 0.15 }}
    >
      {/* Enhanced clickable indicator with animation */}
      <motion.div
        className={`absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 bg-muted/30 rounded-full flex items-center justify-center transition-shadow duration-200 shadow-sm ${
          isExpanded ? "opacity-80" : "opacity-60 group-hover:opacity-80"
        }`}
        initial={false}
        animate={{
          rotate: isExpanded ? 180 : 0,
          scale: isExpanded ? 1 : 0.95,
          backgroundColor: isExpanded
            ? "rgba(0, 0, 0, 0.04)"
            : "rgba(0, 0, 0, 0.02)",
        }}
        transition={{
          duration: 0.2, // Faster animation to match book expansion
          ease: [0.32, 0.72, 0, 1], // Custom easing for more natural motion
        }}
        whileHover={{
          scale: 1.1,
          backgroundColor: "rgba(0, 0, 0, 0.06)",
          opacity: 0.9,
        }}
      >
        <ChevronDown className="h-4 w-4 text-foreground/70" />
      </motion.div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-grow space-y-2">
          {/* Title and Author with enhanced interactive elements */}
          <div>
            <motion.h3
              className="text-lg sm:text-xl font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              {book.title}
            </motion.h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <motion.span
                className="text-sm font-medium cursor-pointer inline-flex items-center gap-1 group-hover:text-primary transition-colors relative"
                onClick={handleAuthorSummaryToggle}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
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
                      className={`relative inline-flex rounded-full h-2 w-2 bg-amber-500 
                                 ${
                                   isAuthorInfoVisible
                                     ? "opacity-100"
                                     : "opacity-80"
                                 } 
                                 transition-all duration-300`}
                    />
                    {isAuthorInfoVisible && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-amber-200 dark:bg-amber-700 animate-pulse"
                      />
                    )}
                  </span>
                )}
              </motion.span>
            </div>
          </div>

          {/* Book Metadata with simplified state indication */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary/60" />
              <span>{formatDate(book.createdAt)}</span>
            </div>
            {book.notes && book.notes.length > 0 && (
              <div className="flex items-center">
                <PenLine className="h-3.5 w-3.5 mr-1.5 text-primary/60" />
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
            {/* Status message */}
            <motion.div
              className="flex items-center text-primary"
              animate={{ opacity: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-xs font-medium italic pr-1">
                {isExpanded ? "(kliknutím zavřete)" : "(kliknutím otevřete)"}
              </span>
            </motion.div>
          </div>
        </div>

        {/* Import and use the standalone BookActionButtons component */}
        <BookActionButtons
          book={book}
          setIsAuthorInfoVisible={setIsAuthorInfoVisible}
          isAuthorInfoVisible={isAuthorInfoVisible}
          setAuthorSummaryModal={setAuthorSummaryModal}
          handleDeleteAuthorSummary={handleDeleteAuthorSummary}
          isGeneratingAuthorSummary={isGeneratingAuthorSummary}
          handleBookDelete={handleBookDelete}
        />
      </div>
    </motion.div>
  );
};

export default function BookComponent({
  book: initialBook,
  onDelete,
}: BookProps) {
  // Only import what we actually use from useSubscription
  const { refreshSubscription } = useSubscription();
  const { refreshSubscriptionData } = useSubscriptionContext();

  // Function to refresh all subscription data
  const refreshAllSubscriptionData = useCallback(async () => {
    try {
      // Refresh the data in both contexts
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

  // Refs
  const bookRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const notesEndRef = useRef<HTMLDivElement>(null);

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

  // Update the useEffect for the click outside handler to be more forgiving
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if we're clicking inside a modal dialog
      if (
        event.target instanceof HTMLElement &&
        (event.target.closest('[role="dialog"]') ||
          event.target.closest(".modal-content"))
      ) {
        return;
      }

      // Only close if we're clicking far away from the book
      if (
        bookRef.current &&
        !bookRef.current.contains(event.target as Node) &&
        isExpanded
      ) {
        // Get the distance from the book element
        const bookRect = bookRef.current.getBoundingClientRect();
        const clickX = event.clientX;
        const clickY = event.clientY;

        // Calculate the distance from the click to the nearest edge of the book
        const distX = Math.max(
          bookRect.left - clickX,
          clickX - bookRect.right,
          0
        );
        const distY = Math.max(
          bookRect.top - clickY,
          clickY - bookRect.bottom,
          0
        );

        // Calculate the Euclidean distance
        const distance = Math.sqrt(distX * distX + distY * distY);

        // Only close if the click is more than 100px away from the book
        if (distance > 100) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  // Improve the smooth scroll effect when expanding a book
  useEffect(() => {
    if (isExpanded) {
      // Wait for the animation to complete before scrolling
      setTimeout(() => {
        if (bookRef.current) {
          const bookRect = bookRef.current.getBoundingClientRect();

          // Check if top of book is above viewport or bottom is below viewport
          const isTooHigh = bookRect.top < 80; // Allow some space for header
          const isTooLow = bookRect.bottom > window.innerHeight - 40;

          // Only scroll if the book isn't optimally positioned
          if (isTooHigh || isTooLow) {
            // Calculate the best position - aim to have the book header at about 15% of screen height
            const optimalPosition =
              window.scrollY + bookRect.top - window.innerHeight * 0.15;

            window.scrollTo({
              top: optimalPosition,
              behavior: "smooth",
            });
          }
        }
      }, 200); // Reduced wait time for better responsiveness
    }
  }, [isExpanded]);

  // Add a smooth scroll to the notes section when adding a new note
  useEffect(() => {
    if (notes.length > 0 && isExpanded) {
      // Scroll to the bottom of notes when a new note is added
      notesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [notes.length, isExpanded]);

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

      // Scroll to the bottom of the notes list after a short delay
      setTimeout(() => {
        notesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Error adding note:", error);
      showErrorMessage("Nepodařilo se přidat poznámku");
    } finally {
      setIsAddingNote(false);
    }
  };

  // Improve the toggleExpanded function to have better event handling
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

      // Add a subtle haptic-like feedback by slightly scaling the element temporarily
      if (bookRef.current) {
        bookRef.current.style.transform = "scale(0.995)";
        setTimeout(() => {
          if (bookRef.current) {
            bookRef.current.style.transform = "";
          }
        }, 100);
      }

      setIsExpanded(!isExpanded);
    },
    [isExpanded]
  );

  const handleGenerateSummary = async (
    preferencesToUse: SummaryPreferences
  ) => {
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

  const handleGenerateAuthorSummary = async (
    preferencesToUse: AuthorSummaryPreferences
  ) => {
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

  // Add click outside handler for author summary
  useEffect(() => {
    if (!isAuthorInfoVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the author summary
      const target = event.target as Node;
      const authorSummaryElement = document.getElementById(
        `author-summary-${book.id}`
      );

      if (authorSummaryElement && !authorSummaryElement.contains(target)) {
        // Close the author info without the ripple effect
        handleCloseAuthorInfo();
      }
    };

    // Add escape key handler to close author summary
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isAuthorInfoVisible) {
        handleCloseAuthorInfo();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isAuthorInfoVisible, book.id, handleCloseAuthorInfo]);

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

      // After expanding, scroll the summary into view with a small delay
      setTimeout(() => {
        const summaryElement = document.getElementById(`note-${noteId}`);
        if (summaryElement) {
          summaryElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }, 100);
    },
    []
  );

  // Add a new keydown handler for the ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close active note when pressing ESC
      if (e.key === "Escape") {
        if (activeNoteId) {
          setActiveNoteId(null);
          e.preventDefault();
        } else if (isAuthorInfoVisible) {
          handleCloseAuthorInfo();
          e.preventDefault();
        } else if (isExpanded) {
          setIsExpanded(false);
          e.preventDefault();
        }
      }

      // Improve keyboard navigation - use arrows to move between books if not in a text field
      if (
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          const books = Array.from(
            document.querySelectorAll("[aria-expanded]")
          ).filter(
            (el) =>
              el.getAttribute("role") === "button" &&
              el.closest(".book-component")
          );

          const currentIndex = books.findIndex(
            (book) => book.getAttribute("aria-expanded") === "true"
          );

          if (currentIndex !== -1) {
            let targetIndex = currentIndex;

            if (e.key === "ArrowUp") {
              targetIndex = Math.max(0, currentIndex - 1);
            } else {
              targetIndex = Math.min(books.length - 1, currentIndex + 1);
            }

            if (targetIndex !== currentIndex) {
              (books[targetIndex] as HTMLElement).focus();
              e.preventDefault();
            }
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeNoteId, isAuthorInfoVisible, isExpanded, handleCloseAuthorInfo]);

  // Add a function to handle closing the summary with animation
  const handleCloseSummary = useCallback(() => {
    // Use a more elegant fade out animation before closing
    const elementToAnimate = document.getElementById(`note-${activeNoteId}`);
    if (elementToAnimate) {
      // Apply a subtle animation before closing
      elementToAnimate.style.transition = "transform 0.15s ease";
      elementToAnimate.style.transform = "scale(0.99)";

      // Short delay to allow the animation to be visible
      setTimeout(() => {
        setActiveNoteId(null);
      }, 80);
    } else {
      setActiveNoteId(null);
    }
  }, [activeNoteId]);

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
    <motion.div
      ref={bookRef}
      className="book-component bg-background rounded-lg border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-visible"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Book Header - now using the BookHeader component */}
      <BookHeader
        book={book}
        isExpanded={isExpanded}
        toggleExpanded={toggleExpanded}
        handleBookDelete={handleBookDelete}
        setIsAuthorInfoVisible={setIsAuthorInfoVisible}
        isAuthorInfoVisible={isAuthorInfoVisible}
        setAuthorSummaryModal={setAuthorSummaryModal}
        handleDeleteAuthorSummary={handleDeleteAuthorSummary}
        isGeneratingAuthorSummary={isGeneratingAuthorSummary}
        handleAuthorSummaryToggle={handleAuthorSummaryToggle}
      />

      {/* Author Info Panel - remains the same */}
      <AnimatePresence mode="sync" onExitComplete={handleAnimationComplete}>
        {isAuthorInfoVisible && book.authorSummary && (
          <motion.div
            id={`author-${book.id}`}
            initial={{
              opacity: 0,
              height: 0,
              overflow: "hidden",
              transformOrigin: "top center",
            }}
            animate={{
              opacity: 1,
              height: "auto",
              overflow: "visible",
              y: 0,
            }}
            exit={{
              opacity: 0,
              height: 0,
              overflow: "hidden",
              y: -5,
              transition: {
                opacity: { duration: 0.2, ease: "easeOut" },
                height: { duration: 0.25, ease: [0.32, 0.72, 0, 1] },
                y: { duration: 0.15, ease: "easeInOut" },
              },
            }}
            transition={{
              opacity: { duration: 0.3, ease: "easeIn" },
              height: { duration: 0.35, ease: [0.65, 0, 0.35, 1] },
              y: { duration: 0.25, ease: "easeOut" },
            }}
            className="relative w-full max-w-[800px] z-10 mx-auto my-4 overflow-hidden"
          >
            {/* Modern, flat card design with improved visual hierarchy */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg overflow-hidden border border-amber-100 dark:border-amber-900/30">
              {/* Top accent line with animation */}
              <motion.div
                className="h-1 bg-gradient-to-r from-amber-400 to-amber-500 w-full"
                initial={{ scaleX: 0.7, opacity: 0.7 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
              ></motion.div>

              {/* Close button with improved animation */}
              <motion.div
                className="absolute -top-2 -right-2 z-10"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-700 dark:text-amber-300 h-7 w-7 p-0 rounded-full shadow-sm border border-amber-200/70 dark:border-amber-800/70 transition-all duration-200"
                  onClick={handleCloseAuthorInfo}
                  aria-label="Zavřít informace o autorovi"
                  title="Zavřít informace o autorovi (ESC)"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="sr-only">Zavřít</span>
                </Button>
              </motion.div>

              {/* Author header with portrait area - more modern and flat design */}
              <div className="px-5 py-4">
                <div className="flex items-start gap-4">
                  {/* Author portrait placeholder with subtle animation */}
                  <motion.div
                    className="h-16 w-16 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/20 flex items-center justify-center flex-shrink-0 border border-amber-200 dark:border-amber-800/50 shadow-sm"
                    initial={{ opacity: 0, scale: 0.9, rotateZ: -5 }}
                    animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <User className="h-8 w-8 text-amber-500 dark:text-amber-400" />
                  </motion.div>

                  {/* Author name and metadata with staggered animation */}
                  <div className="flex-1">
                    <motion.h2
                      className="text-xl font-medium text-zinc-800 dark:text-zinc-100"
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
                      <span className="inline-flex items-center text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800/50">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI generováno
                      </span>
                    </motion.div>

                    {/* Action buttons in header area with staggered animation */}
                    <motion.div
                      className="flex flex-wrap gap-2 mt-3"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25, duration: 0.3 }}
                    >
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAuthorSummaryModal(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:border-amber-800/50 dark:hover:bg-amber-950/50 transition-all duration-200 text-xs py-1"
                      >
                        <Sparkles className="h-3 w-3 mr-1.5" />
                        <span>Aktualizovat</span>
                      </Button>

                      <ExportButton
                        content={book.authorSummary}
                        filename={`${book.author}_info.md`}
                        buttonProps={{
                          variant: "outline",
                          size: "sm",
                          className:
                            "text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800/50 dark:hover:bg-amber-950/50 transition-all text-xs py-1",
                        }}
                      />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Main content area with fade-in animation */}
              <motion.div
                className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <div className="prose prose-zinc prose-sm md:prose dark:prose-invert max-w-none w-full prose-headings:text-amber-600 dark:prose-headings:text-amber-400 prose-headings:font-medium">
                  <StudyContent content={book.authorSummary} />
                </div>
              </motion.div>

              {/* Footer area with utilities - fade-in animation */}
              <motion.div
                className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 px-5 py-3 flex justify-between items-center"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => handleCopyNote(book.authorSummary || "", e)}
                    className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Kopírovat text</span>
                  </button>

                  <button
                    onClick={handleDeleteAuthorSummary}
                    className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Smazat</span>
                  </button>
                </div>

                {/* Close button with hover animation */}
                <motion.button
                  onClick={handleCloseAuthorInfo}
                  className="text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Zavřít</span>
                </motion.button>
              </motion.div>

              {/* ESC key indicator with fade-in animation */}
              <motion.div
                className="absolute top-4 right-12 hidden sm:flex items-center gap-1.5"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <div className="bg-amber-50 dark:bg-amber-900/40 px-2 py-0.5 rounded text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 shadow-sm border border-amber-100 dark:border-amber-800/50">
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white dark:bg-zinc-900 rounded border border-amber-200 dark:border-amber-700 shadow-sm">
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
      <AnimatePresence initial={false} mode="sync">
        {isExpanded && (
          <motion.div
            id={`book-content-${book.id}`}
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -5 }}
            transition={{
              duration: 0.3,
              height: { duration: 0.35, ease: [0.65, 0, 0.35, 1] },
              opacity: { duration: 0.25 },
            }}
            className="p-3 sm:p-4 space-y-4 sm:space-y-5 w-full"
          >
            {/* Notes Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-medium text-foreground">
                Poznámky a shrnutí
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {/* Note Filter Buttons */}
                <div className="flex items-center bg-muted rounded-md p-0.5">
                  <motion.button
                    whileHover={{
                      backgroundColor:
                        activeNoteFilter === "all" ? "" : "rgba(0,0,0,0.03)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      activeNoteFilter === "all"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setActiveNoteFilter("all")}
                  >
                    Vše
                  </motion.button>
                  <motion.button
                    whileHover={{
                      backgroundColor:
                        activeNoteFilter === "manual" ? "" : "rgba(0,0,0,0.03)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      activeNoteFilter === "manual"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setActiveNoteFilter("manual")}
                  >
                    Moje
                  </motion.button>
                  <motion.button
                    whileHover={{
                      backgroundColor:
                        activeNoteFilter === "ai" ? "" : "rgba(0,0,0,0.03)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      activeNoteFilter === "ai"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setActiveNoteFilter("ai")}
                  >
                    AI
                  </motion.button>
                </div>

                {/* Generate Summary Button */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-950/50 transition-all duration-200"
                    onClick={() => setSummaryModal(true)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-2 border-current border-t-transparent rounded-full animate-spin mr-1.5"></div>
                        <span>Generuji...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        <span>Generovat shrnutí</span>
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Notes List - now using the NotesList component */}
            {notes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Zatím nemáte žádné poznámky k této knize.</p>
                <p className="text-sm mt-1">
                  Přidejte poznámku pomocí formuláře níže.
                </p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
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
              </motion.div>
            )}

            {/* Add Note Form */}
            <div className="pt-4 border-t border-border/40">
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error and Success Messages remain the same */}
      <AnimatePresence>
        {errorMessages.length > 0 && (
          <div className="p-4 space-y-2">
            {errorMessages.map((error, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md"
              >
                <div className="flex items-start sm:items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 sm:mt-0 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error.message}
                  </p>
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
                className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-md"
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
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {success.message}
                  </p>
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
    </motion.div>
  );
}
