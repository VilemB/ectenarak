"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { generateId, formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Modal } from "@/components/ui/modal";
import { motion, AnimatePresence } from "framer-motion";
import {
  SummaryPreferencesModal,
  SummaryPreferences,
} from "./SummaryPreferencesModal";
import { useSummaryPreferences } from "@/contexts/SummaryPreferencesContext";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "book" | "note";
    noteId?: string;
  }>({ isOpen: false, type: "book" });
  const [summaryModal, setSummaryModal] = useState(false);

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

  return (
    <motion.div
      variants={listItemVariants}
      className="bg-card rounded-lg border border-border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer"
      onClick={() => notes.length > 0 && setIsExpanded(!isExpanded)}
    >
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-base font-medium text-foreground">
              {book.title}
            </h3>
            <p className="text-sm text-muted-foreground">{book.author}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-8 w-8 p-0"
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
              variant="ghost"
              size="sm"
              className={`text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full h-8 w-8 p-0 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              } ${notes.length > 0 ? "group-hover:bg-primary/5" : ""}`}
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

      <div className="px-6 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs">{formatDate(book.createdAt)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingNote(true);
            }}
          >
            <PenLine className="h-3.5 w-3.5 mr-1.5" />
            Přidat poznámku
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 border-violet-200 hover:bg-gradient-to-r hover:from-violet-500/20 hover:to-purple-500/20 rounded-full transition-all duration-300 shadow-sm hover:shadow"
            onClick={(e) => {
              e.stopPropagation();
              setSummaryModal(true);
            }}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-violet-500" />
            Nastavení shrnutí
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/20 rounded-full"
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
                Rychlé shrnutí
              </>
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isAddingNote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 pb-6"
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
                  className="rounded-full"
                  onClick={() => setIsAddingNote(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Zrušit
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="rounded-full"
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
            className="border-t border-border bg-card/50 px-6 py-4"
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
                  className="mt-2 rounded-full"
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
                    className={`p-4 rounded-lg border ${
                      note.isAISummary
                        ? "border-amber-300/30 bg-amber-50/10"
                        : note.isError
                        ? "border-red-300/30 bg-red-50/10"
                        : "border-border bg-secondary/30"
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
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-6 w-6 p-0"
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

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: "book" })}
        title={deleteModal.type === "book" ? "Smazat knihu" : "Smazat poznámku"}
      >
        <div className="p-6">
          <p className="text-foreground mb-4">
            {deleteModal.type === "book"
              ? `Opravdu chceš smazat knihu "${book.title}" a všechny její poznámky?`
              : "Opravdu chceš smazat tuto poznámku?"}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, type: "book" })}
            >
              Zrušit
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Smazat
            </Button>
          </div>
        </div>
      </Modal>

      <SummaryPreferencesModal
        isOpen={summaryModal}
        onClose={() => setSummaryModal(false)}
        onGenerate={handleGenerateSummary}
        isGenerating={isGenerating}
      />
    </motion.div>
  );
}
