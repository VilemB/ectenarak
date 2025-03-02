"use client";

import { useState, useEffect } from "react";
import { Book, Note } from "@/types";
import { Button } from "@/components/ui/button";
import {
  PenLine,
  Sparkles,
  ChevronDown,
  Trash2,
  Calendar,
  X,
  Check,
  MessageSquare,
  Plus,
  BookOpen,
  AlertCircle,
  Loader2,
  Settings,
  User,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { generateId, formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  SummaryPreferencesModal,
  SummaryPreferences,
} from "./SummaryPreferencesModal";
import { useSummaryPreferences } from "@/contexts/SummaryPreferencesContext";
import { ExportButton } from "./ExportButton";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface BookProps {
  book: Book;
  onDelete: (bookId: string) => void;
}

const listItemVariants = {
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Add new animation variants for the expand/collapse
const expandVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.2 },
    },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.3, delay: 0.1 },
    },
  },
};

export default function BookComponent({ book, onDelete }: BookProps) {
  const [notes, setNotes] = useLocalStorage<Note[]>(
    `book-${book.id}-notes`,
    []
  );
  const [newNote, setNewNote] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAuthorInfo, setIsGeneratingAuthorInfo] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAuthorInfoVisible, setIsAuthorInfoVisible] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "book" | "note";
    noteId?: string;
  }>({ isOpen: false, type: "book" });
  const [summaryModal, setSummaryModal] = useState(false);
  const [books, setBooks] = useLocalStorage<Book[]>("books", []);

  // Get global preferences
  const { preferences } = useSummaryPreferences();

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const note: Note = {
      id: generateId(),
      bookId: book.id,
      content: newNote,
      createdAt: new Date().toISOString(),
    };

    setNotes([...notes, note]);
    setNewNote("");
    setIsAddingNote(false);
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

        // Set a temporary error message
        const errorNote: Note = {
          id: generateId(),
          bookId: book.id,
          content:
            "Pro generování shrnutí je potřeba nejprve přidat alespoň jednu poznámku k této knize.",
          createdAt: new Date().toISOString(),
          isError: true,
        };

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
      const summary: Note = {
        id: generateId(),
        bookId: book.id,
        content: data.summary,
        createdAt: new Date().toISOString(),
        isAISummary: true,
      };

      // Remove previous AI summaries
      const filteredNotes = notes.filter(
        (note) => !note.isAISummary && !note.isError
      );
      setNotes([...filteredNotes, summary]);
      setSummaryModal(false);
    } catch (error) {
      console.error("Error generating summary:", error);

      // Add an error note
      const errorNote: Note = {
        id: generateId(),
        bookId: book.id,
        content:
          "Nastala chyba při generování shrnutí. Zkuste to prosím znovu později.",
        createdAt: new Date().toISOString(),
        isError: true,
      };

      setNotes([...notes.filter((note) => !note.isError), errorNote]);

      // Remove the error message after 5 seconds
      setTimeout(() => {
        setNotes((notes) => notes.filter((note) => !note.isError));
      }, 5000);

      setSummaryModal(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // Add a function to generate summary with current global preferences
  const handleQuickGenerateSummary = async () => {
    await handleGenerateSummary(preferences);
  };

  const handleDeleteNote = (noteId: string) => {
    setDeleteModal({ isOpen: true, type: "note", noteId });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.type === "book") {
      onDelete(book.id);
    } else if (deleteModal.type === "note" && deleteModal.noteId) {
      setNotes(notes.filter((note) => note.id !== deleteModal.noteId));
    }
    setDeleteModal({ isOpen: false, type: "book" });
  };

  // Add a function to generate author summary
  const handleGenerateAuthorInfo = async () => {
    setIsGeneratingAuthorInfo(true);
    try {
      const response = await fetch("/api/generate-author-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author: book.author,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate author summary");
      }

      const data = await response.json();
      const summary = data.summary;

      // Update the book with the author summary
      const updatedBooks = books.map((b) => {
        if (b.id === book.id) {
          return { ...b, authorSummary: summary };
        }
        return b;
      });

      setBooks(updatedBooks);

      // Show the author info panel
      setIsAuthorInfoVisible(true);
    } catch (error) {
      console.error("Error generating author summary:", error);
      // You could add error handling here
    } finally {
      setIsGeneratingAuthorInfo(false);
    }
  };

  // Show author info automatically if it exists and was just added
  useEffect(() => {
    // If the book has an author summary, check if we should show it automatically
    if (book.authorSummary) {
      // Check if this book was recently added (within the last 5 seconds)
      const bookAddedRecently =
        new Date().getTime() - new Date(book.createdAt).getTime() < 5000;

      if (bookAddedRecently) {
        // Show the author info panel automatically for newly added books
        setIsAuthorInfoVisible(true);
      }
    }
  }, [book.id, book.authorSummary, book.createdAt]);

  return (
    <motion.div
      variants={listItemVariants}
      className="bg-card rounded-lg border border-border/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer"
      onClick={() => {
        // Only toggle expansion if there are notes and no modal is open
        if (notes.length > 0 && !deleteModal.isOpen && !summaryModal) {
          setIsExpanded(!isExpanded);
        }
      }}
    >
      <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
          <div>
            <h3 className="text-base font-medium text-foreground">
              {book.title}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm text-muted-foreground">{book.author}</p>
              {book.authorSummary && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative group px-2 py-0.5 h-auto rounded-full bg-amber-100/10 text-amber-500 hover:bg-amber-100/20 hover:text-amber-400 transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAuthorInfoVisible(!isAuthorInfoVisible);
                  }}
                >
                  <User className="h-3 w-3 mr-1" />
                  <span className="text-xs font-medium">O autorovi</span>
                  <span
                    className={`absolute -right-1 -top-1 flex h-3 w-3 ${
                      isAuthorInfoVisible ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                </Button>
              )}
            </div>
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

      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs">{formatDate(book.createdAt)}</span>
          </div>
        </div>

        <AnimatePresence>
          {isAuthorInfoVisible && book.authorSummary && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                duration: 0.3,
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
              className="mt-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative p-4 sm:p-5 bg-gradient-to-br from-amber-900/20 via-amber-800/15 to-amber-900/10 border border-amber-700/30 rounded-lg shadow-md">
                <div className="absolute -top-3 left-5 bg-amber-500 text-white px-3 py-1 rounded-full shadow-sm flex items-center">
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs font-medium">O autorovi</span>
                </div>
                <div className="absolute top-3 right-3">
                  <Button
                    variant="icon"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-amber-700/20 text-amber-500"
                    onClick={() => setIsAuthorInfoVisible(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="pt-3">
                  <h4 className="text-lg font-medium text-amber-500 mb-3">
                    {book.author}
                  </h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-amber-200/90 prose-p:my-2 prose-headings:text-amber-400 prose-strong:text-amber-300 prose-strong:font-medium">
                    <ReactMarkdown>{book.authorSummary}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-2 mt-3">
          <div className="flex flex-wrap gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-all duration-200 shadow-sm hover:shadow flex-grow sm:flex-grow-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddingNote(true);
              }}
            >
              <PenLine className="h-3.5 w-3.5 mr-1.5" />
              Přidat poznámku
            </Button>

            {!book.authorSummary && (
              <Button
                variant="outline"
                size="sm"
                className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 transition-all duration-200 shadow-sm hover:shadow flex-grow sm:flex-grow-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateAuthorInfo();
                }}
                disabled={isGeneratingAuthorInfo}
              >
                {isGeneratingAuthorInfo ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Generuji...
                  </>
                ) : (
                  <>
                    <User className="h-3.5 w-3.5 mr-1.5" />
                    Informace o autorovi
                  </>
                )}
              </Button>
            )}

            <div className="flex flex-wrap gap-2 ml-auto mt-2 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                className="group bg-slate-800/50 text-slate-300 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600/50 hover:text-slate-200 transition-all duration-300 shadow-sm hover:shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  setSummaryModal(true);
                }}
              >
                <Settings className="h-3.5 w-3.5 mr-1.5 text-slate-400 transition-transform duration-300 ease-in-out group-hover:rotate-90" />
                Nastavení shrnutí
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 transition-all duration-200 shadow-sm hover:shadow"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickGenerateSummary();
                }}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Generuji...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Generovat shrnutí
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAddingNote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 sm:px-6 pb-4 sm:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleAddNote} className="space-y-3">
              <div className="relative">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Napiš svou poznámku..."
                  className="w-full p-3 border border-border rounded-lg bg-secondary/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y min-h-[120px]"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                  onClick={() => setIsAddingNote(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Zrušit
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={!newNote.trim()}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Uložit
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            variants={expandVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="border-t border-border/50 bg-card/50 px-4 sm:px-6 py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium text-foreground flex items-center mb-3">
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Poznámky ({notes.length})
            </h3>

            {notes.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">
                  Zatím nemáš žádné poznámky k této knize.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddingNote(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Přidat první poznámku
                </Button>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {notes.map((note) => (
                  <motion.div
                    key={note.id}
                    variants={listItemVariants}
                    className={`p-3 sm:p-4 rounded-lg border ${
                      note.isAISummary
                        ? "border-amber-500/30 bg-amber-500/5"
                        : note.isError
                        ? "border-red-500/30 bg-red-500/5"
                        : "border-border/50 bg-secondary/20"
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
                            <span className="text-xs font-medium">Chyba</span>
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
              </motion.div>
            )}
          </motion.div>
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
            ? `Opravdu chceš smazat knihu "${book.title}" a všechny její poznámky?`
            : "Opravdu chceš smazat tuto poznámku?"
        }
        confirmText="Smazat"
        variant="destructive"
        showCancelButton={false}
        showCloseButton={true}
      />

      {/* Summary Preferences Modal */}
      <SummaryPreferencesModal
        isOpen={summaryModal}
        onClose={() => setSummaryModal(false)}
        onGenerate={handleGenerateSummary}
        isGenerating={isGenerating}
      />
    </motion.div>
  );
}
