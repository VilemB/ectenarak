"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Info,
  BookOpen,
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

const noteVariants = {
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
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
    },
  },
};

export default function BookComponent({ book, onDelete }: BookProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAuthorInfoVisible, setIsAuthorInfoVisible] = useState(false);
  const [errorMessages, setErrorMessages] = useState<
    { id: string; message: string }[]
  >([]);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "book" | "note";
    noteId?: string;
  }>({ isOpen: false, type: "book" });
  const [summaryModal, setSummaryModal] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);

  // Fetch notes from the database when the component mounts or when expanded
  useEffect(() => {
    const fetchNotes = async () => {
      if (!book.id || !isExpanded) return;

      // Only set loading state if we haven't fetched notes yet
      if (!hasAttemptedFetch) {
        setIsLoadingNotes(true);
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
            id:
              note._id || `note-${Math.random().toString(36).substring(2, 11)}`,
            bookId: book.id,
            content: note.content,
            createdAt: new Date(note.createdAt).toISOString(),
            isAISummary: note.isAISummary || false,
          })
        );

        setNotes(formattedNotes);
        setHasAttemptedFetch(true);
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setIsLoadingNotes(false);
      }
    };

    fetchNotes();
  }, [book.id, isExpanded, hasAttemptedFetch]);

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

  // Memoize the sorted notes to prevent unnecessary re-renders
  const sortedNotes = useCallback(() => {
    return [...notes].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notes]);

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

  // Prevent propagation for buttons inside the book
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Add a function to show error messages
  const showErrorMessage = (message: string) => {
    const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setErrorMessages((prev) => [...prev, { id, message }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setErrorMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 5000);
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
    if (deleteModal.type === "book") {
      onDelete(book.id);
    } else if (deleteModal.type === "note" && deleteModal.noteId) {
      try {
        const response = await fetch(
          `/api/books/${book.id}/notes/${deleteModal.noteId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete note");
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
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    }

    // Close the modal
    setDeleteModal({ isOpen: false, type: "book" });
  };

  return (
    <div
      ref={bookRef}
      className={`bg-background rounded-lg border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 ${
        isExpanded ? "shadow-md" : ""
      }`}
    >
      <div
        className={`p-4 sm:p-5 cursor-pointer group ${
          isExpanded ? "rounded-t-lg" : "rounded-lg"
        }`}
        onClick={handleBookClick}
      >
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex h-10 w-10 rounded-full bg-primary/10 items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            <div className="flex flex-wrap items-center text-muted-foreground gap-x-3 gap-y-1 mt-1">
              <div className="flex items-center">
                <User className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-sm">{book.author}</span>
                {book.authorSummary && (
                  <Button
                    variant="icon"
                    size="sm"
                    className="ml-1 text-muted-foreground hover:text-primary hover:bg-primary/10 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAuthorInfoVisible(!isAuthorInfoVisible);
                    }}
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span className="sr-only">Author info</span>
                  </Button>
                )}
              </div>
              <div className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">{formatDate(book.createdAt)}</span>
              </div>
              {notes.length > 0 && (
                <div className="flex items-center">
                  <PenLine className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">
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

          <div
            className="flex gap-2 mt-1 sm:mt-0 ml-auto"
            onClick={handleButtonClick}
          >
            <ExportButton book={book} notes={notes} />
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors h-9"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal({ isOpen: true, type: "book" });
              }}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              <span>Smazat</span>
            </Button>
            <Button
              variant={isExpanded ? "default" : "outline"}
              size="sm"
              className={`transition-all duration-200 h-9 ${
                isExpanded ? "" : "hover:bg-primary/10 hover:text-primary"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse notes" : "Expand notes"}
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

        {isAuthorInfoVisible && book.authorSummary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-md text-sm border border-amber-200/50 dark:border-amber-800/30"
            onClick={handleButtonClick}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center text-amber-700 dark:text-amber-500">
                <User className="h-4 w-4 mr-2" />
                <span className="font-medium">O autorovi</span>
              </div>
              <Button
                variant="icon"
                size="sm"
                className="text-amber-600/70 dark:text-amber-500/70 hover:text-amber-700 hover:bg-amber-200/30 dark:hover:bg-amber-800/30 h-6 w-6"
                onClick={() => setIsAuthorInfoVisible(false)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <div className="prose prose-amber prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{book.authorSummary}</ReactMarkdown>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              variants={expandedContentVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="mt-5 pt-5 border-t border-border/50"
              onClick={handleButtonClick}
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5">
                <h4 className="text-base font-medium flex items-center">
                  <PenLine className="h-4 w-4 mr-2 text-primary" />
                  Poznámky a shrnutí
                </h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-sm hover:border-primary/30 hover:bg-primary/5"
                    onClick={() => setSummaryModal(true)}
                  >
                    <Sparkles className="h-4 w-4 mr-1.5 text-amber-500" />
                    Generovat shrnutí
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-9 text-sm"
                    onClick={() => setIsAddingNote(true)}
                  >
                    <PenLine className="h-4 w-4 mr-1.5" />
                    Přidat poznámku
                  </Button>
                </div>
              </div>

              {isLoadingNotes ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-10 px-4 border border-dashed border-border/50 rounded-lg bg-muted/30">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3">
                    <PenLine className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-foreground font-medium">
                    Zatím nemáte žádné poznámky k této knize
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    Přidejte své myšlenky, citáty nebo poznámky o knize pro
                    pozdější využití.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 hover:border-primary/30"
                    onClick={() => setIsAddingNote(true)}
                  >
                    <PenLine className="h-4 w-4 mr-1.5" />
                    Přidat první poznámku
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedNotes().map((note) => (
                    <motion.div
                      key={
                        note.id ||
                        `note-${Math.random().toString(36).substring(2, 11)}`
                      }
                      variants={noteVariants}
                      className={`p-4 rounded-md border ${
                        note.isAISummary
                          ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/30"
                          : note.isError
                          ? "bg-red-50/60 dark:bg-red-950/30 border-red-200/50 dark:border-red-800/30"
                          : "bg-muted/40 border-border/40"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2.5">
                        <div className="flex items-center">
                          {note.isAISummary ? (
                            <div className="flex items-center text-amber-600 dark:text-amber-500 bg-amber-100/50 dark:bg-amber-900/30 py-0.5 px-2 rounded-full">
                              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                              <span className="text-xs font-medium">
                                AI Shrnutí
                              </span>
                            </div>
                          ) : note.isError ? (
                            <div className="flex items-center text-red-600 dark:text-red-500 bg-red-100/50 dark:bg-red-900/30 py-0.5 px-2 rounded-full">
                              <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                              <span className="text-xs font-medium">Chyba</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-muted-foreground bg-background/80 py-0.5 px-2 rounded-full border border-border/30">
                              <Calendar className="h-3 w-3 mr-1.5" />
                              <span className="text-xs">
                                {formatDate(note.createdAt)}
                              </span>
                            </div>
                          )}
                        </div>
                        {!note.isError && (
                          <Button
                            variant="icon"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Delete note</span>
                          </Button>
                        )}
                      </div>
                      <div
                        className={`prose prose-sm dark:prose-invert max-w-none ${
                          note.isAISummary
                            ? "prose-amber"
                            : note.isError
                            ? "prose-red"
                            : ""
                        }`}
                      >
                        <ReactMarkdown>{note.content}</ReactMarkdown>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <AnimatePresence>
                {isAddingNote && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-5"
                  >
                    <form onSubmit={handleAddNote} className="space-y-4">
                      <div className="border border-border/50 rounded-lg bg-muted/20 p-1">
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Napiš svou poznámku..."
                          className="w-full p-3 rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y min-h-[150px]"
                          autoFocus
                        />
                        <div className="flex justify-between items-center px-2 py-1.5">
                          <div className="text-xs text-muted-foreground">
                            Podporuje Markdown
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsAddingNote(false)}
                              className="h-8 text-xs"
                            >
                              Zrušit
                            </Button>
                            <Button
                              type="submit"
                              variant="default"
                              size="sm"
                              disabled={!newNote.trim()}
                              className="h-8 text-xs"
                            >
                              Uložit poznámku
                            </Button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Display error messages */}
      <AnimatePresence>
        {errorMessages.length > 0 && (
          <div className="px-4 pb-4">
            {errorMessages.map((error) => (
              <motion.div
                key={error.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-md border bg-red-50/60 dark:bg-red-950/30 border-red-200/50 dark:border-red-800/30 mb-2"
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

      {/* Delete Confirmation Dialog */}
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
