"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Book, Note } from "@/types";
import { Button } from "@/components/ui/button";
import {
  PenLine,
  Sparkles,
  ChevronDown,
  Trash2,
  X,
  AlertCircle,
  User,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
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

// Improved animation variants
const expandedContentVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.2 },
    },
  },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      height: { duration: 0.4 },
      opacity: { duration: 0.3, delay: 0.1 },
    },
  },
};

// Animation variants for note items
const noteItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export default function BookComponent({
  book: initialBook,
  onDelete,
}: BookProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Validate the book object
  useEffect(() => {
    if (!initialBook || Object.keys(initialBook).length === 0) {
      console.error("Empty book object passed to BookComponent:", initialBook);
    }

    if (!initialBook.id) {
      console.error("Book without ID passed to BookComponent:", initialBook);
    }
  }, [initialBook]);

  // Create a safe book object with fallbacks for all properties
  const safeBook = {
    id: initialBook.id || `temp-${Math.random().toString(36).substring(2, 9)}`,
    title: initialBook.title || "Untitled Book",
    author: initialBook.author || "Unknown Author",
    createdAt: initialBook.createdAt || new Date().toISOString(),
    authorSummary: initialBook.authorSummary || "",
    authorId: initialBook.authorId || "",
    userId: initialBook.userId || "",
    notes: initialBook.notes || [],
  };

  // Rest of the component uses safeBook instead of initialBook
  const [book, setBook] = useState<Book>(safeBook);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAuthorSummary, setIsGeneratingAuthorSummary] =
    useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAuthorInfoVisible, setIsAuthorInfoVisible] = useState(false);
  const [activeNoteFilter, setActiveNoteFilter] = useState<
    "all" | "regular" | "ai"
  >("all");
  const [errorMessages, setErrorMessages] = useState<
    Array<{ id: string; message: string }>
  >([]);
  const [successMessages, setSuccessMessages] = useState<
    Array<{ id: string; message: string }>
  >([]);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "book" | "note";
    noteId?: string;
    isLoading?: boolean;
  }>({ isOpen: false, type: "book", isLoading: false });
  const [summaryModal, setSummaryModal] = useState(false);
  const [authorSummaryModal, setAuthorSummaryModal] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const notesEndRef = useRef<HTMLDivElement>(null);

  // Update local book state when props change, with validation
  useEffect(() => {
    if (initialBook && Object.keys(initialBook).length > 0) {
      setBook(initialBook);
    } else {
      console.error(
        "Warning: Book component received empty book object in props update:",
        initialBook
      );
    }
  }, [initialBook]);

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

  // Memoize fetchNotes with useCallback
  const fetchNotes = useCallback(async () => {
    if (!book.id || book.id.startsWith("temp-")) {
      console.error("Cannot fetch notes: Invalid book ID", book.id);
      showErrorMessage("Nelze načíst poznámky: Neplatné ID knihy");
      return;
    }

    try {
      const response = await fetch(`/api/books/${book.id}/notes`);

      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }

      const data = await response.json();

      // Transform the data to match the Note interface
      const formattedNotes = data.notes.map(
        (note: {
          _id: string;
          content: string;
          createdAt: string;
          isAISummary?: boolean;
        }) => ({
          id: note._id || `note-${Math.random().toString(36).substring(2, 11)}`,
          bookId: book.id,
          content: note.content,
          createdAt: new Date(note.createdAt).toISOString(),
          isAISummary: note.isAISummary || false,
        })
      );

      setNotes(formattedNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  }, [book.id, showErrorMessage]);

  // Add useEffect to call fetchNotes
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

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

  // Toggle expanded state when clicking on the book
  const handleBookClick = () => {
    setIsExpanded(!isExpanded);

    // If expanding, scroll to the book after a short delay
    if (!isExpanded) {
      setTimeout(() => {
        bookRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  const handleGenerateSummary = async (
    preferencesToUse: SummaryPreferences
  ) => {
    setIsGenerating(true);
    try {
      const notesText = notes
        .filter((note) => !note.isAISummary)
        .map((note) => note.content)
        .join("\n\n");

      if (!notesText.trim()) {
        // Show a message if there are no notes to generate a summary from
        setIsGenerating(false);
        setSummaryModal(false);

        // Use the new error message function instead of creating a temporary note
        showErrorMessage(
          "Pro generování shrnutí je potřeba nejprve přidat alespoň jednu poznámku k této knize."
        );
        return;
      }

      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookTitle: book.title,
          bookAuthor: book.author,
          notes: notesText,
          preferences: preferencesToUse,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();

      // Add the AI summary as a note in the database
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

      if (!summaryResponse.ok) {
        throw new Error("Failed to save summary");
      }

      const summaryData = await summaryResponse.json();

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

  const handleDeleteNote = async (noteId: string) => {
    setDeleteModal({ isOpen: true, type: "note", noteId, isLoading: false });
  };

  const handleConfirmDelete = async () => {
    if (book.id) {
      onDelete(book.id);
    }
    setShowDeleteConfirm(false);
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

        // Update both the local notes state and the book state
        setNotes(formattedNotes);
        setBook((prevBook) => ({
          ...prevBook,
          notes: formattedNotes,
        }));

        // Show success message
        showSuccessMessage("Poznámka byla úspěšně smazána");
      } catch (error) {
        console.error("Error deleting note:", error);
        showErrorMessage("Nepodařilo se smazat poznámku");
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
    console.log("=== HANDLE GENERATE AUTHOR SUMMARY CALLED ===");

    if (!book.id) {
      showErrorMessage("Nelze generovat informace o autorovi pro knihu bez ID");
      return;
    }

    if (!book.author) {
      showErrorMessage("Nelze generovat informace o autorovi bez jména autora");
      return;
    }

    console.log("Generating author summary for:", book.author);
    console.log("Book ID:", book.id);
    console.log("Preferences:", preferencesToUse);

    setIsGeneratingAuthorSummary(true);

    try {
      // Use the new consolidated API endpoint
      const apiUrl = `/api/author-summary`;
      console.log("API URL:", apiUrl);
      console.log(
        "Request payload:",
        JSON.stringify(
          {
            author: book.author,
            preferences: preferencesToUse,
            bookId: book.id,
          },
          null,
          2
        )
      );

      console.log("Sending API request...");

      let response;
      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            author: book.author,
            preferences: preferencesToUse,
            bookId: book.id,
          }),
        });
        console.log("API request sent");
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw new Error(
          `Network error: ${
            fetchError instanceof Error
              ? fetchError.message
              : String(fetchError)
          }`
        );
      }

      console.log("API response status:", response.status);
      console.log(
        "API response headers:",
        Array.from(response.headers).reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {} as Record<string, string>)
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error response:", errorData);
        throw new Error(
          errorData.error || "Nepodařilo se získat informace o autorovi"
        );
      }

      const data = await response.json();
      console.log("API success response:", data);

      setBook((prevBook) => ({
        ...prevBook,
        authorSummary: data.summary,
      }));
      setAuthorSummaryModal(false); // Close the modal after successful generation
      setIsAuthorInfoVisible(true);
      showSuccessMessage("Informace o autorovi byly úspěšně vygenerovány");
    } catch (error) {
      console.error("Error generating author summary:", error);
      showErrorMessage(
        error instanceof Error
          ? error.message
          : "Nepodařilo se vygenerovat informace o autorovi"
      );
    } finally {
      setIsGeneratingAuthorSummary(false);
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

    setShowDeleteConfirm(true);
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

  // Handle textarea keyboard shortcuts
  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    // Submit form with Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (newNote.trim() && !isAddingNote && book.id) {
        handleAddNote(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <div
      ref={bookRef}
      className="bg-background rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* Book Header */}
      <div
        className={`p-5 cursor-pointer ${
          isExpanded ? "border-b border-border/40" : ""
        }`}
        onClick={handleBookClick}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-grow space-y-3">
            {/* Title and Author */}
            <div>
              <h3 className="text-xl font-medium text-foreground group-hover:text-primary transition-colors">
                {book.title}
              </h3>
              <div className="flex items-center mt-1.5">
                <div
                  className="group cursor-pointer flex items-center gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (book.authorSummary) {
                      setIsAuthorInfoVisible(!isAuthorInfoVisible);
                    } else {
                      setAuthorSummaryModal(true);
                    }
                  }}
                >
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {book.author}
                  </span>
                  {book.authorSummary && (
                    <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)] group-hover:shadow-[0_0_12px_rgba(245,158,11,0.8)] transition-all"></span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Book Metadata */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary/60" />
                <span>{formatDate(book.createdAt)}</span>
              </div>
              {notes.length > 0 && (
                <div className="flex items-center">
                  <PenLine className="h-3.5 w-3.5 mr-1.5 text-primary/60" />
                  <span>
                    {notes.length}{" "}
                    {notes.length === 1
                      ? "poznámka"
                      : notes.length > 1 && notes.length < 5
                      ? "poznámky"
                      : "poznámek"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row">
            {!book.authorSummary && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setAuthorSummaryModal(true);
                }}
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-950/50 transition-all duration-200"
                disabled={!book.id || isGeneratingAuthorSummary}
              >
                {isGeneratingAuthorSummary ? (
                  <>
                    <div className="animate-spin mr-1.5 h-3 w-3 border-t-2 border-b-2 border-current rounded-full"></div>
                    <span>Generuji...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                    <span>Info o autorovi</span>
                  </>
                )}
              </Button>
            )}

            <div className="flex gap-1.5">
              <ExportButton book={book} notes={notes} />

              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBookDelete();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <Button
                variant={isExpanded ? "default" : "outline"}
                size="sm"
                className="transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                aria-expanded={isExpanded}
              >
                <ChevronDown
                  className={`h-4 w-4 mr-1.5 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
                <span>{isExpanded ? "Skrýt" : "Zobrazit"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Author Summary Panel */}
      <AnimatePresence>
        {isAuthorInfoVisible && book.authorSummary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mx-5 my-3 p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 rounded-lg text-sm border border-amber-200/50 dark:border-amber-800/30 shadow-inner"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center text-amber-700 dark:text-amber-400">
                <User className="h-4 w-4 mr-2" />
                <span className="font-medium">O autorovi</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-amber-600/70 dark:text-amber-500/70 hover:text-amber-700 hover:bg-amber-200/30 dark:hover:bg-amber-800/30 h-6 w-6 p-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAuthorInfoVisible(false);
                }}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Zavřít</span>
              </Button>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="prose prose-amber prose-sm dark:prose-invert max-w-none"
            >
              <ReactMarkdown>{book.authorSummary}</ReactMarkdown>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Content (Notes) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={expandedContentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="p-5 bg-gradient-to-b from-background to-background/80"
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-medium flex items-center text-foreground/90">
                  <PenLine className="h-4 w-4 mr-2 text-primary" />
                  Poznámky a shrnutí
                </h4>
                {notes.length > 0 && (
                  <div className="inline-flex items-center justify-center bg-primary/10 text-primary text-xs font-medium rounded-full h-5 min-w-5 px-1.5">
                    {notes.length}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-950/50 transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSummaryModal(true);
                  }}
                  disabled={isGenerating || !book.id}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin mr-1.5 h-3 w-3 border-t-2 border-b-2 border-current rounded-full"></div>
                      <span>Generuji...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                      <span>Generovat shrnutí</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Note Filters */}
            {notes.length > 0 && (
              <div className="flex mb-4 border-b border-border/40 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setActiveNoteFilter("all")}
                  className={`px-4 py-2 text-sm font-medium transition-all relative ${
                    activeNoteFilter === "all"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Všechny poznámky
                  <span className="ml-1.5 inline-flex items-center justify-center bg-background text-xs font-medium rounded-full h-5 min-w-5 px-1.5 border border-border/60">
                    {notes.length}
                  </span>
                  {activeNoteFilter === "all" && (
                    <motion.div
                      layoutId="activeFilter"
                      className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveNoteFilter("regular")}
                  className={`px-4 py-2 text-sm font-medium transition-all relative ${
                    activeNoteFilter === "regular"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Moje poznámky
                  <span className="ml-1.5 inline-flex items-center justify-center bg-background text-xs font-medium rounded-full h-5 min-w-5 px-1.5 border border-border/60">
                    {notes.filter((note) => !note.isAISummary).length}
                  </span>
                  {activeNoteFilter === "regular" && (
                    <motion.div
                      layoutId="activeFilter"
                      className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveNoteFilter("ai")}
                  className={`px-4 py-2 text-sm font-medium transition-all relative ${
                    activeNoteFilter === "ai"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  AI shrnutí
                  <span className="ml-1.5 inline-flex items-center justify-center bg-background text-xs font-medium rounded-full h-5 min-w-5 px-1.5 border border-border/60">
                    {notes.filter((note) => note.isAISummary).length}
                  </span>
                  {activeNoteFilter === "ai" && (
                    <motion.div
                      layoutId="activeFilter"
                      className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </button>
              </div>
            )}

            {/* Notes List */}
            <div className="space-y-4 mb-6">
              {notes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="text-center py-8 text-muted-foreground bg-background/50 rounded-lg border border-dashed border-border/60"
                >
                  <div className="flex justify-center mb-3">
                    <PenLine className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm mb-2">Zatím nemáte žádné poznámky.</p>
                  <p className="text-xs text-muted-foreground/70">
                    Přidejte svou první poznámku pomocí formuláře níže.
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence initial={false}>
                  {notes
                    .filter((note) => {
                      if (activeNoteFilter === "all") return true;
                      if (activeNoteFilter === "regular")
                        return !note.isAISummary;
                      if (activeNoteFilter === "ai") return note.isAISummary;
                      return true;
                    })
                    .map((note) => (
                      <motion.div
                        key={note.id}
                        layout
                        variants={noteItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={`relative p-4 rounded-lg border shadow-sm hover:shadow-md ${
                          note.isAISummary
                            ? "bg-amber-50/50 border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-800/30"
                            : "bg-background border-border/60"
                        } ${
                          deleteModal.type === "note" &&
                          deleteModal.noteId === note.id &&
                          deleteModal.isLoading
                            ? "opacity-50"
                            : ""
                        } transition-all duration-200`}
                      >
                        {note.isAISummary && (
                          <div className="absolute top-3 right-3 flex items-center text-xs text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                            <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
                            <span>AI shrnutí</span>
                          </div>
                        )}
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{note.content}</ReactMarkdown>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/30">
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Calendar className="h-3 w-3 mr-1.5 text-muted-foreground/70" />
                            {formatDate(note.createdAt)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 px-2 transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            aria-label="Smazat poznámku"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Smazat poznámku</span>
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  <div ref={notesEndRef} />
                </AnimatePresence>
              )}
            </div>

            {/* Add Note Form */}
            <form
              onSubmit={handleAddNote}
              className="mt-6 bg-background/50 p-4 rounded-lg border border-border/60 shadow-sm"
            >
              <h5 className="text-sm font-medium mb-3 flex items-center text-foreground/90">
                <PenLine className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
                Přidat novou poznámku
                <kbd className="ml-2 inline-flex items-center gap-1 rounded border border-border/60 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">Alt</span>+
                  <span className="text-xs">N</span>
                </kbd>
              </h5>
              <div className="flex flex-col gap-3">
                <div>
                  <textarea
                    ref={textareaRef}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={handleTextareaKeyDown}
                    placeholder="Zapište své myšlenky, postřehy nebo citace z knihy..."
                    className="w-full p-3 rounded-lg border border-border/60 focus:border-primary focus:ring-1 focus:ring-primary bg-background resize-none transition-all duration-200"
                    rows={3}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-muted-foreground">
                      {newNote.length > 0 ? (
                        <span>{newNote.length} znaků</span>
                      ) : (
                        <span className="text-muted-foreground/60">
                          Tip: Použijte{" "}
                          <kbd className="px-1 py-0.5 text-[10px] font-mono rounded border border-border/60 bg-background">
                            Ctrl+Enter
                          </kbd>{" "}
                          pro rychlé uložení
                        </span>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={!newNote.trim() || isAddingNote || !book.id}
                      className="relative overflow-hidden"
                    >
                      {isAddingNote ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-background rounded-full"></div>
                          <span>Ukládám...</span>
                        </>
                      ) : (
                        <>
                          <PenLine className="h-4 w-4 mr-1.5" />
                          <span>Přidat poznámku</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Messages */}
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
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error.message}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Success Messages */}
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

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, type: "book", isLoading: false })
        }
        onConfirm={
          deleteModal.type === "book"
            ? handleConfirmDelete
            : handleConfirmDeleteNote
        }
        title={deleteModal.type === "book" ? "Smazat knihu" : "Smazat poznámku"}
        description={
          deleteModal.type === "book"
            ? `Opravdu chcete smazat knihu "${book.title}"? Tato akce je nevratná.`
            : "Opravdu chcete smazat tuto poznámku? Tato akce je nevratná."
        }
        confirmText={
          deleteModal.type === "book" ? "Smazat knihu" : "Smazat poznámku"
        }
        cancelText="Zrušit"
        isLoading={deleteModal.isLoading}
        variant="destructive"
      />

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Smazat knihu"
        description={`Opravdu chcete smazat knihu "${book.title}"? Tato akce je nevratná.`}
        confirmText="Smazat knihu"
        cancelText="Zrušit"
      />

      {/* Summary Preferences Modal */}
      <SummaryPreferencesModal
        isOpen={summaryModal}
        onClose={() => setSummaryModal(false)}
        onGenerate={handleGenerateSummary}
        isGenerating={isGenerating}
        title="Generovat shrnutí knihy"
        description="Vyberte preferovaný styl a zaměření shrnutí knihy."
      />

      {/* Add Author Summary Preferences Modal */}
      <AuthorSummaryPreferencesModal
        isOpen={authorSummaryModal}
        onClose={() => setAuthorSummaryModal(false)}
        onGenerate={handleGenerateAuthorSummary}
        isGenerating={isGeneratingAuthorSummary}
        title="Informace o autorovi"
        description="Vyberte preferovaný styl a zaměření informací o autorovi."
      />
    </div>
  );
}
