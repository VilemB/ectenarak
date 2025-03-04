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

interface BookProps {
  book: Book;
  onDelete: (bookId: string) => void;
}

// Improved animation variants
const expandedContentVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.3,
    },
  },
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
  const [errorMessages, setErrorMessages] = useState<
    Array<{ id: string; message: string }>
  >([]);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "book" | "note";
    noteId?: string;
  }>({ isOpen: false, type: "book" });
  const [summaryModal, setSummaryModal] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

      // Transform the notes data
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

      setNotes(formattedNotes);
      setNewNote("");
      setIsAddingNote(false);
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  // Toggle expanded state when clicking on the book
  const handleBookClick = () => {
    setIsExpanded(!isExpanded);
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
    setDeleteModal({ isOpen: true, type: "note", noteId });
  };

  const handleConfirmDelete = async () => {
    if (book.id) {
      onDelete(book.id);
    }
    setShowDeleteConfirm(false);
  };

  // Update the handleGenerateAuthorSummary function with better validation
  const handleGenerateAuthorSummary = async () => {
    setIsGeneratingAuthorSummary(true);

    try {
      // Debug the book object
      console.log("Book object:", book);
      console.log("Book ID:", book.id);

      // Validate book data before proceeding
      if (!book || Object.keys(book).length === 0) {
        console.error("Cannot generate author summary: Book object is empty");
        showErrorMessage(
          "Chyba: Data knihy nejsou k dispozici. Zkuste obnovit stránku."
        );
        return;
      }

      if (!book.author) {
        console.error("Cannot generate author summary: Author is missing");
        showErrorMessage("Chyba: Jméno autora chybí. Zkuste obnovit stránku.");
        return;
      }

      // Call the API to generate author summary
      const summaryResponse = await fetch("/api/generate-author-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author: book.author,
        }),
      });

      if (!summaryResponse.ok) {
        throw new Error("Failed to generate author summary");
      }

      const summaryData = await summaryResponse.json();

      // Make sure we have a valid book ID
      if (!book.id) {
        console.error("Book ID is missing from book object:", book);
        showErrorMessage(
          "Chyba: ID knihy chybí. Zkuste obnovit stránku a přidat knihu znovu."
        );
        return;
      }

      // Log the URL we're about to call
      const updateUrl = `/api/books/${book.id}`;
      console.log("Calling update API at:", updateUrl);

      // Update the book with the new author summary
      const updateResponse = await fetch(updateUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorSummary: summaryData.summary,
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error("API error:", errorData);
        throw new Error(
          `Failed to update book with author summary: ${
            errorData.error || "Unknown error"
          }`
        );
      }

      // Process the response
      const updateData = await updateResponse.json();
      console.log("Update response:", updateData);

      // Update the local book state with the new author summary
      setBook((prevBook) => ({
        ...prevBook,
        authorSummary: summaryData.summary,
      }));

      // Show the author info after generation
      setIsAuthorInfoVisible(true);
    } catch (error) {
      console.error("Error generating author summary:", error);
      showErrorMessage(
        "Nepodařilo se vygenerovat shrnutí autora. Zkuste to prosím znovu."
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
                  className="flex items-center relative group cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (book.authorSummary) {
                      setIsAuthorInfoVisible(!isAuthorInfoVisible);
                    } else if (!isGeneratingAuthorSummary && book.id) {
                      handleGenerateAuthorSummary();
                    }
                  }}
                >
                  <User className="h-4 w-4 mr-1.5 text-primary/70" />
                  <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    {book.author}
                  </span>

                  {/* Author Summary Indicator */}
                  {book.authorSummary && (
                    <span
                      className="ml-2 h-2.5 w-2.5 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.5)] group-hover:shadow-[0_0_12px_rgba(251,191,36,0.7)] transition-all duration-300"
                      title="Klikněte pro zobrazení informací o autorovi"
                    />
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
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-950/50 transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateAuthorSummary();
                }}
                disabled={isGeneratingAuthorSummary || !book.id}
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
            className="p-5"
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
              <h4 className="text-base font-medium flex items-center">
                <PenLine className="h-4 w-4 mr-2 text-primary" />
                Poznámky a shrnutí
              </h4>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-primary border-primary/30 hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSummaryModal(true);
                  }}
                  disabled={isGenerating || !book.id}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  <span>Generovat shrnutí</span>
                </Button>
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-4 mb-6">
              {notes.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  Zatím nemáte žádné poznámky. Přidejte první níže.
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className={`relative p-4 rounded-lg border ${
                      note.isAISummary
                        ? "bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30"
                        : "bg-background border-border/60"
                    }`}
                  >
                    {note.isAISummary && (
                      <div className="absolute top-3 right-3 flex items-center text-xs text-primary/70">
                        <Sparkles className="h-3 w-3 mr-1" />
                        <span>AI shrnutí</span>
                      </div>
                    )}
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{note.content}</ReactMarkdown>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(note.createdAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Smazat poznámku</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="mt-4">
              <div className="flex flex-col gap-3">
                <div>
                  <textarea
                    ref={textareaRef}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Přidat novou poznámku..."
                    className="w-full p-3 rounded-lg border border-border/60 focus:border-primary focus:ring-1 focus:ring-primary bg-background resize-none transition-all duration-200"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end">
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

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: "book" })}
        onConfirm={handleConfirmDelete}
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
      />
    </div>
  );
}
