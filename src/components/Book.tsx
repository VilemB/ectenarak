"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Book, Note } from "@/types";
import { Button } from "@/components/ui/button";
import {
  PenLine,
  Sparkles,
  ChevronDown,
  Trash2,
  X,
  AlertCircle,
  Calendar,
  Copy,
  Loader2,
  BookOpen,
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

interface BookProps {
  book: Book;
  onDelete: (bookId: string) => void;
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
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button
        variant="ghost"
        size="sm"
        className="bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-700 dark:text-amber-300 h-7 w-7 p-0 rounded-full shadow-md border border-amber-200/70 dark:border-amber-800/70 transition-all duration-200"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
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
  onClick: (e: React.MouseEvent) => void;
  text: string;
}) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1.5 transition-colors"
  >
    <Trash2 className="h-3.5 w-3.5" />
    <span>{text}</span>
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
    <span>{text}</span>
  </motion.button>
);

// Study-friendly content formatter component
const StudyContent = ({ content }: { content: string }) => {
  return (
    <div className="study-summary">
      <div
        className="prose prose-amber prose-sm dark:prose-invert 
                   prose-headings:mt-6 prose-headings:mb-3 prose-headings:font-bold prose-headings:text-amber-800 dark:prose-headings:text-amber-300 
                   prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                   prose-p:my-3 prose-p:text-sm prose-p:leading-relaxed
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

export default function BookComponent({
  book: initialBook,
  onDelete,
}: BookProps) {
  // Validate the book object
  const safeBook: Book = useMemo(() => {
    return {
      id: initialBook.id || `temp-${Date.now()}`,
      title: initialBook.title || "Untitled Book",
      author: initialBook.author || "Unknown Author",
      authorId: initialBook.authorId || "",
      userId: initialBook.userId || "",
      status: initialBook.status || "not_started",
      notes: initialBook.notes || [],
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
  const [isAuthorInfoVisible, setIsAuthorInfoVisible] = useState(false);
  const [activeNoteFilter, setActiveNoteFilter] = useState<
    "all" | "regular" | "ai"
  >("all");
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
  const [notes, setNotes] = useState<Note[]>([]);
  const [errorMessages, setErrorMessages] = useState<
    Array<{ id: string; message: string }>
  >([]);
  const [successMessages, setSuccessMessages] = useState<
    Array<{ id: string; message: string }>
  >([]);

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

  // Handle clicks outside the book component to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        bookRef.current &&
        !bookRef.current.contains(event.target as Node) &&
        isExpanded
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  // Add a smooth scroll effect when expanding a book
  useEffect(() => {
    if (isExpanded) {
      // Wait for the animation to complete before scrolling
      setTimeout(() => {
        if (bookRef.current) {
          const bookRect = bookRef.current.getBoundingClientRect();
          const isBookVisible =
            bookRect.top >= 0 && bookRect.bottom <= window.innerHeight;

          // Only scroll if the book isn't fully visible
          if (!isBookVisible) {
            const offset =
              bookRect.height > window.innerHeight
                ? 100 // If book is taller than viewport, just scroll to top with some padding
                : window.innerHeight / 3; // Otherwise center it more or less

            window.scrollTo({
              top: window.scrollY + bookRect.top - offset,
              behavior: "smooth",
            });
          }
        }
      }, 400); // Wait for expansion animation to be mostly complete
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

  // Expand/collapse the book card
  const toggleExpanded = (e: React.MouseEvent | React.KeyboardEvent) => {
    // Don't toggle if clicking on buttons or interactive elements
    if (
      e.target instanceof HTMLButtonElement ||
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target instanceof HTMLElement &&
        (e.target.closest("button") ||
          e.target.closest(".modal-content") || // Don't collapse when clicking modal content
          e.target.closest("[role='dialog']"))) // Don't collapse when clicking any dialog
    ) {
      return;
    }

    // If it's a keyboard event, only toggle on Enter or Space
    if (e.type === "keydown") {
      const keyEvent = e as React.KeyboardEvent;
      if (keyEvent.key !== "Enter" && keyEvent.key !== " ") {
        return;
      }
      // Prevent scrolling when pressing space
      if (keyEvent.key === " ") {
        keyEvent.preventDefault();
      }
    }

    // Add haptic feedback if supported
    if (navigator.vibrate && window.innerWidth <= 768) {
      navigator.vibrate(5); // Subtle vibration on mobile
    }

    setIsExpanded(!isExpanded);
  };

  const handleGenerateSummary = async (
    preferencesToUse: SummaryPreferences
  ) => {
    console.log("=== HANDLE GENERATE SUMMARY CALLED ===");
    console.log("Preferences:", preferencesToUse);

    setIsGenerating(true);
    try {
      // Get notes text if available, but don't require it
      const notesText = notes
        .filter((note) => !note.isAISummary)
        .map((note) => note.content)
        .join("\n\n");

      console.log("Notes text length:", notesText.length);

      console.log("Sending API request to generate summary...");
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookTitle: book.title,
          bookAuthor: book.author,
          notes: notesText, // This can now be empty
          preferences: preferencesToUse,
        }),
      });
      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error response:", errorData);
        throw new Error(errorData.error || "Failed to generate summary");
      }

      const data = await response.json();
      console.log("Summary generated successfully");

      // Add the AI summary as a note in the database
      console.log("Saving summary as a note...");
      const summaryResponse = await fetch(`/api/books/${book.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: data.summary,
          isAISummary: true,
        }),
      });
      console.log("Save note response status:", summaryResponse.status);

      if (!summaryResponse.ok) {
        const errorData = await summaryResponse.json().catch(() => ({}));
        console.error("API error response:", errorData);
        throw new Error(errorData.error || "Failed to save summary");
      }

      const summaryData = await summaryResponse.json();
      console.log("Summary saved successfully");

      // Transform the notes data
      const formattedNotes = summaryData.notes.map(
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

      setNotes(formattedNotes);
      setSummaryModal(false);
    } catch (error) {
      console.error("Error generating summary:", error);

      // Use the new error message function
      showErrorMessage(
        "Nastala chyba při generování shrnutí. Zkuste to prosím znovu později."
      );

      setSummaryModal(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle confirmation of delete actions
  const handleConfirmDelete = useCallback(async () => {
    try {
      setDeleteModal((prev) => ({ ...prev, isLoading: true }));

      if (deleteModal.type === "book") {
        try {
          // Delete the book
          const response = await fetch(`/api/books/${book.id}`, {
            method: "DELETE",
          });

          // Even if we get a 404 (book not found), we should still update the UI
          // since the book is no longer in the database
          if (!response.ok && response.status !== 404) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to delete book");
          }

          // Call the onDelete callback to update the parent component
          onDelete(book.id);
          showSuccessMessage("Kniha byla úspěšně smazána");
        } catch (error) {
          console.error("Error deleting book:", error);

          // Even if there's an error, we should still update the UI
          // This ensures the book disappears from the UI
          onDelete(book.id);

          // Still show an error message
          throw error;
        }
      } else if (deleteModal.type === "note" && deleteModal.noteId) {
        // Delete the note
        const response = await fetch(
          `/api/books/${book.id}/notes/${deleteModal.noteId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to delete note");
        }

        // Update the notes state
        setNotes((prev) =>
          prev.filter((note) => note.id !== deleteModal.noteId)
        );
        showSuccessMessage("Poznámka byla úspěšně smazána");
      } else if (deleteModal.type === "authorSummary") {
        // Delete the author summary
        const response = await fetch(`/api/books/${book.id}/author-summary`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to delete author summary");
        }

        // Update the book state with undefined instead of null for authorSummary
        setBook((prev) => ({ ...prev, authorSummary: undefined }));
        showSuccessMessage("Informace o autorovi byly úspěšně smazány");
      }
    } catch (error) {
      console.error(`Error deleting ${deleteModal.type}:`, error);
      showErrorMessage(
        `Nepodařilo se smazat ${
          deleteModal.type === "book"
            ? "knihu"
            : deleteModal.type === "note"
            ? "poznámku"
            : "informace o autorovi"
        }`
      );
    } finally {
      setDeleteModal({
        isOpen: false,
        type: "book",
        isLoading: false,
      });
    }
  }, [
    book.id,
    deleteModal.noteId,
    deleteModal.type,
    onDelete,
    showErrorMessage,
    showSuccessMessage,
  ]);

  const handleGenerateAuthorSummary = async (
    preferences: AuthorSummaryPreferences
  ) => {
    setIsGeneratingAuthorSummary(true);
    try {
      const response = await fetch("/api/generate-author-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorName: book.author,
          authorId: book.authorId,
          preferences,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate author summary");
      }

      const data = await response.json();

      // Update the book with the new author summary
      const updateResponse = await fetch(
        `/api/books/${book.id}/author-summary`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authorSummary: data.summary,
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error("Failed to save author summary");
      }

      // Update the local book state
      setBook((prev) => ({
        ...prev,
        authorSummary: data.summary,
      }));

      showSuccessMessage("Informace o autorovi byly úspěšně vygenerovány");
    } catch (error) {
      console.error("Error generating author summary:", error);
      showErrorMessage("Nepodařilo se vygenerovat informace o autorovi");
    } finally {
      setIsGeneratingAuthorSummary(false);
      setAuthorSummaryModal(false);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when the book is expanded
      if (!isExpanded) return;

      // Check if no modal is open
      const noModalOpen =
        !deleteModal.isOpen && !summaryModal && !authorSummaryModal;

      // Check if not typing in a text field
      const notInTextField =
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA";

      // Add note with Alt+N
      if (e.altKey && e.key === "n" && noModalOpen && notInTextField) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded, deleteModal.isOpen, summaryModal, authorSummaryModal]);

  // Add a function to handle closing the author summary with scroll position preservation
  const handleCloseAuthorInfo = useCallback(() => {
    // Save the current scroll position before closing
    setIsAuthorInfoVisible(false);
  }, []);

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

  // Filtered notes based on the active filter
  const filteredNotes = useMemo(() => {
    if (activeNoteFilter === "all") return notes;
    if (activeNoteFilter === "regular")
      return notes.filter((note) => !note.isAISummary);
    if (activeNoteFilter === "ai")
      return notes.filter((note) => note.isAISummary);
    return notes;
  }, [notes, activeNoteFilter]);

  return (
    <motion.div
      ref={bookRef}
      className={`relative rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/50 bg-white dark:bg-gray-900 overflow-hidden transition-all duration-300 ${
        isExpanded
          ? "shadow-md mb-6"
          : "hover:shadow-md hover:border-amber-200 dark:hover:border-amber-800/50 mb-4"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={toggleExpanded}
      onKeyDown={toggleExpanded}
      tabIndex={0}
      role="button"
      aria-expanded={isExpanded}
      aria-label={`Kniha ${book.title} od ${book.author}`}
    >
      {/* Collapsed view */}
      <div
        className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${
          isExpanded ? "border-b border-amber-100 dark:border-amber-900/30" : ""
        }`}
      >
        {/* Book status indicator */}
        <div className="flex items-center gap-3 sm:w-auto">
          <div
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              book.status === "completed"
                ? "bg-green-500"
                : book.status === "in_progress"
                ? "bg-amber-500"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
            title={
              book.status === "completed"
                ? "Přečteno"
                : book.status === "in_progress"
                ? "Právě čtu"
                : "Nepřečteno"
            }
          ></div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
            {book.title}
          </h3>
        </div>

        <div className="flex flex-row justify-between items-center sm:flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
            {book.author}
          </p>

          <div className="flex items-center gap-2">
            {/* Note count badge */}
            {notes.length > 0 && (
              <span className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                {notes.length}{" "}
                {notes.length === 1
                  ? "poznámka"
                  : notes.length < 5
                  ? "poznámky"
                  : "poznámek"}
              </span>
            )}

            {/* AI summary badge */}
            {notes.some((note) => note.isAISummary) && (
              <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full flex items-center">
                <Sparkles className="h-3 w-3 mr-1" />
                AI
              </span>
            )}

            {/* Expand/collapse indicator */}
            <ChevronDown
              className={`h-4 w-4 text-amber-500 dark:text-amber-400 transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </div>

      {/* Expanded view */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-5 space-y-4">
              {/* Book details */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6">
                {/* Left column - Book info */}
                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      O knize
                    </h4>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{book.author}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                        <span className="text-sm">
                          Přidáno {formatDate(book.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Author info button */}
                  {book.authorId && (
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-950/50 transition-all duration-200"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setIsAuthorInfoVisible(!isAuthorInfoVisible);
                        }}
                      >
                        <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                        <span>
                          {isAuthorInfoVisible
                            ? "Skrýt informace o autorovi"
                            : "Zobrazit informace o autorovi"}
                        </span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Right column - Actions */}
                <div className="flex flex-row sm:flex-col gap-2 justify-start">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:text-purple-400 dark:border-purple-900/50 dark:hover:bg-purple-950/50 transition-all duration-200"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setSummaryModal(true);
                    }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        <span>Generuji...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        <span>Vytvořit AI shrnutí</span>
                      </>
                    )}
                  </Button>

                  <ExportButton book={book} notes={notes} />
                </div>
              </div>

              {/* Author info section */}
              <AnimatePresence>
                {isAuthorInfoVisible && book.authorId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-visible"
                  >
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 relative overflow-visible">
                      <CloseButtonTop
                        onClick={() => setIsAuthorInfoVisible(false)}
                        label="Zavřít informace o autorovi"
                        title="Zavřít"
                      />

                      <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-1.5">
                          <div className="flex items-center justify-center rounded-full w-6 h-6 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            <BookOpen className="h-3.5 w-3.5" />
                          </div>
                          <span>O autorovi: {book.author}</span>
                        </h4>

                        {book.authorSummary ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw, rehypeSanitize]}
                            >
                              {book.authorSummary}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Zatím nemáte žádné informace o tomto autorovi.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:text-purple-400 dark:border-purple-900/50 dark:hover:bg-purple-950/50 transition-all duration-200"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setAuthorSummaryModal(true);
                              }}
                              disabled={isGeneratingAuthorSummary}
                            >
                              {isGeneratingAuthorSummary ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                  <span>Generuji...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                                  <span>Vygenerovat pomocí AI</span>
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {book.authorSummary && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:text-purple-400 dark:border-purple-900/50 dark:hover:bg-purple-950/50 transition-all duration-200"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setAuthorSummaryModal(true);
                              }}
                              disabled={isGeneratingAuthorSummary}
                            >
                              {isGeneratingAuthorSummary ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                  <span>Generuji...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                                  <span>Přegenerovat</span>
                                </>
                              )}
                            </Button>

                            <DeleteButton
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setDeleteModal({
                                  isOpen: true,
                                  type: "authorSummary",
                                  isLoading: false,
                                });
                              }}
                              text="Smazat informace o autorovi"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notes section */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Poznámky a shrnutí
                  </h4>

                  {/* Note filters */}
                  {notes.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        className={`px-2 py-1 rounded-full transition-colors ${
                          activeNoteFilter === "all"
                            ? "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200"
                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setActiveNoteFilter("all");
                        }}
                      >
                        Vše ({notes.length})
                      </button>
                      <button
                        className={`px-2 py-1 rounded-full transition-colors ${
                          activeNoteFilter === "regular"
                            ? "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200"
                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setActiveNoteFilter("regular");
                        }}
                      >
                        Poznámky (
                        {notes.filter((note) => !note.isAISummary).length})
                      </button>
                      <button
                        className={`px-2 py-1 rounded-full transition-colors ${
                          activeNoteFilter === "ai"
                            ? "bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200"
                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setActiveNoteFilter("ai");
                        }}
                      >
                        AI shrnutí (
                        {notes.filter((note) => note.isAISummary).length})
                      </button>
                    </div>
                  )}
                </div>

                {/* Notes list */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredNotes.length > 0 ? (
                    filteredNotes.map((note) => (
                      <div
                        key={note.id}
                        className={`p-3 rounded-lg relative ${
                          note.isAISummary
                            ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30"
                            : "bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
                        }`}
                      >
                        {note.isAISummary && (
                          <div className="absolute top-2 right-2">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI
                            </span>
                          </div>
                        )}

                        {note.isAISummary ? (
                          <StudyContent content={note.content} />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {note.content}
                          </p>
                        )}

                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatDate(note.createdAt)}</span>
                          <div className="flex items-center gap-3">
                            {note.isAISummary && (
                              <CopyButton
                                onClick={() => {
                                  navigator.clipboard.writeText(note.content);
                                  showSuccessMessage("Zkopírováno do schránky");
                                }}
                                text="Kopírovat"
                              />
                            )}
                            <DeleteButton
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setDeleteModal({
                                  isOpen: true,
                                  type: "note",
                                  noteId: note.id,
                                  isLoading: false,
                                });
                              }}
                              text="Smazat"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 px-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activeNoteFilter === "all"
                          ? "Zatím nemáte žádné poznámky k této knize."
                          : activeNoteFilter === "regular"
                          ? "Zatím nemáte žádné vlastní poznámky k této knize."
                          : "Zatím nemáte žádná AI shrnutí k této knize."}
                      </p>
                    </div>
                  )}
                  <div ref={notesEndRef} />
                </div>

                {/* Add note form */}
                <form onSubmit={handleAddNote} className="mt-4">
                  <div className="space-y-3">
                    <div className="relative">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Přidat poznámku..."
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 resize-none min-h-[100px]"
                        disabled={isAddingNote}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={!newNote.trim() || isAddingNote}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        {isAddingNote ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Přidávám...
                          </>
                        ) : (
                          <>
                            <PenLine className="h-4 w-4 mr-2" />
                            Přidat poznámku
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Book actions */}
              <div className="flex flex-wrap justify-between items-center pt-2 border-t border-amber-100 dark:border-amber-900/30">
                <DeleteButton
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setDeleteModal({
                      isOpen: true,
                      type: "book",
                      isLoading: false,
                    });
                  }}
                  text="Smazat knihu"
                />

                <CloseButtonBottom
                  onClick={() => {
                    setIsExpanded(false);
                  }}
                  text="Zavřít"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error messages */}
      <AnimatePresence>
        {errorMessages.length > 0 &&
          errorMessages.map((error) => (
            <motion.div
              key={error.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-2 right-2 z-50 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-sm px-3 py-2 rounded-lg shadow-md flex items-center gap-2 max-w-xs"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error.message}</span>
              <button
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setErrorMessages((prev) =>
                    prev.filter((msg) => msg.id !== error.id)
                  );
                }}
                className="ml-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Success messages */}
      <AnimatePresence>
        {successMessages.length > 0 &&
          successMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-2 right-2 z-50 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-sm px-3 py-2 rounded-lg shadow-md flex items-center gap-2 max-w-xs"
            >
              <span>{msg.message}</span>
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Modals */}
      {summaryModal && (
        <SummaryPreferencesModal
          isOpen={summaryModal}
          onClose={() => setSummaryModal(false)}
          onGenerate={handleGenerateSummary}
          isGenerating={isGenerating}
          title={book.title}
          description="Vygenerujte AI shrnutí knihy"
        />
      )}

      {authorSummaryModal && (
        <AuthorSummaryPreferencesModal
          isOpen={authorSummaryModal}
          onClose={() => setAuthorSummaryModal(false)}
          onGenerate={handleGenerateAuthorSummary}
          isGenerating={isGeneratingAuthorSummary}
          title={book.author}
          description="Vygenerujte informace o autorovi"
        />
      )}

      {/* Confirmation dialog for delete actions */}
      <ConfirmationDialog
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, type: "book", isLoading: false })
        }
        onConfirm={handleConfirmDelete}
        title={
          deleteModal.type === "book"
            ? "Smazat knihu"
            : deleteModal.type === "note"
            ? "Smazat poznámku"
            : "Smazat informace o autorovi"
        }
        description={
          deleteModal.type === "book"
            ? `Opravdu chcete smazat knihu "${book.title}"? Tato akce je nevratná a smaže také všechny poznámky k této knize.`
            : deleteModal.type === "note"
            ? "Opravdu chcete smazat tuto poznámku? Tato akce je nevratná."
            : `Opravdu chcete smazat informace o autorovi "${book.author}"? Tato akce je nevratná.`
        }
        confirmText={
          deleteModal.type === "book"
            ? "Smazat knihu"
            : deleteModal.type === "note"
            ? "Smazat poznámku"
            : "Smazat informace"
        }
        cancelText="Zrušit"
        isLoading={deleteModal.isLoading}
      />
    </motion.div>
  );
}
