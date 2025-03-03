"use client";

import { useState, useEffect } from "react";
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

// Only keep the animation variants that are actually used
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
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "book" | "note";
    noteId?: string;
  }>({ isOpen: false, type: "book" });
  const [summaryModal, setSummaryModal] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);

  // Fetch notes from the database when the component mounts
  useEffect(() => {
    const fetchNotes = async () => {
      if (!book.id) return;

      setIsLoadingNotes(true);
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
            id: note._id,
            bookId: book.id,
            content: note.content,
            createdAt: new Date(note.createdAt).toISOString(),
            isAISummary: note.isAISummary || false,
          })
        );

        setNotes(formattedNotes);
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setIsLoadingNotes(false);
      }
    };

    fetchNotes();
  }, [book.id]);

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

        // Create a temporary error note
        const errorNote: Note = {
          id: "temp-error",
          bookId: book.id,
          content:
            "Pro generování shrnutí je potřeba nejprve přidat alespoň jednu poznámku k této knize.",
          createdAt: new Date().toISOString(),
          isError: true,
        };

        // Add the error note to the local state
        setNotes([...notes, errorNote]);

        // Remove the error message after 5 seconds
        setTimeout(() => {
          setNotes((notes) => notes.filter((note) => !note.isError));
        }, 5000);

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

      // Add an error note
      const errorNote: Note = {
        id: "temp-error",
        bookId: book.id,
        content:
          "Nastala chyba při generování shrnutí. Zkuste to prosím znovu později.",
        createdAt: new Date().toISOString(),
        isError: true,
      };

      // Add the error note to the local state
      setNotes([...notes, errorNote]);

      // Remove the error message after 5 seconds
      setTimeout(() => {
        setNotes((notes) => notes.filter((note) => !note.isError));
      }, 5000);

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
    setDeleteModal({ isOpen: false, type: "book" });
  };

  return (
    <div className="w-full">
      <div
        className={`bg-card rounded-lg shadow-md p-4 mb-4 transition-all duration-300 ${
          isExpanded ? "ring-2 ring-primary/20" : "hover:shadow-lg"
        }`}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-2 sm:mb-0">
            <h3 className="text-lg font-semibold">{book.title}</h3>
            <div className="flex items-center text-muted-foreground">
              <User className="h-3.5 w-3.5 mr-1" />
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
          </div>

          <div className="flex gap-2 mt-1 sm:mt-0">
            <ExportButton book={book} notes={notes} />
            <Button
              variant="icon"
              size="icon"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal({ isOpen: true, type: "book" });
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete book</span>
            </Button>
            {notes.length > 0 && (
              <Button
                variant="icon"
                size="icon"
                className={`text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Collapse notes" : "Expand notes"}
              >
                <ChevronDown className="h-4 w-4" />
                <span className="sr-only">
                  {isExpanded ? "Collapse" : "Expand"}
                </span>
              </Button>
            )}
          </div>
        </div>

        {isAuthorInfoVisible && book.authorSummary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-3 bg-muted/50 rounded-md text-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center text-primary">
                <User className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs font-medium">O autorovi</span>
              </div>
              <Button
                variant="icon"
                size="sm"
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-6 w-6"
                onClick={() => setIsAuthorInfoVisible(false)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
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
              className="mt-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium">Poznámky</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setSummaryModal(true)}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Generovat shrnutí
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setIsAddingNote(true)}
                  >
                    <PenLine className="h-3.5 w-3.5 mr-1.5" />
                    Přidat poznámku
                  </Button>
                </div>
              </div>

              {isLoadingNotes ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Zatím nemáte žádné poznámky k této knize.</p>
                  <p className="text-sm mt-1">
                    Klikněte na &quot;Přidat poznámku&quot; pro vytvoření první
                    poznámky.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes
                    .sort(
                      (a: Note, b: Note) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((note) => (
                      <motion.div
                        key={note.id}
                        variants={noteVariants}
                        className={`p-3 rounded-md ${
                          note.isAISummary
                            ? "bg-amber-50 dark:bg-amber-950/20"
                            : note.isError
                            ? "bg-red-50 dark:bg-red-950/20"
                            : "bg-muted/50"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            {note.isAISummary ? (
                              <div className="flex items-center text-amber-500">
                                <Sparkles className="h-3.5 w-3.5 mr-1" />
                                <span className="text-xs font-medium">
                                  AI Shrnutí
                                </span>
                              </div>
                            ) : note.isError ? (
                              <div className="flex items-center text-red-500">
                                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                <span className="text-xs font-medium">
                                  Chyba
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {formatDate(note.createdAt)}
                              </span>
                            )}
                          </div>
                          {!note.isError && (
                            <Button
                              variant="icon"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNote(note.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                              <span className="sr-only">Delete note</span>
                            </Button>
                          )}
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
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
                    className="mt-4"
                  >
                    <form onSubmit={handleAddNote} className="space-y-3">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Napiš svou poznámku..."
                        className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y min-h-[120px]"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingNote(false)}
                        >
                          Zrušit
                        </Button>
                        <Button
                          type="submit"
                          variant="default"
                          size="sm"
                          disabled={!newNote.trim()}
                        >
                          Uložit poznámku
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
