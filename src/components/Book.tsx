"use client";

import { useState } from "react";
import { Book, Note } from "@/types";
import { Button } from "@/components/ui/button";
import { PenLine, Sparkles, ChevronDown, Loader2, Trash2 } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { generateId, formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Modal } from "@/components/ui/modal";
import { motion, AnimatePresence } from "framer-motion";
import {
  SummaryPreferencesModal,
  SummaryPreferences,
} from "./SummaryPreferencesModal";

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

export default function BookComponent({ book, onDelete }: BookProps) {
  const [notes, setNotes] = useLocalStorage<Note[]>(
    `book-${book.id}-notes`,
    []
  );
  const [newNote, setNewNote] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "book" | "note";
    noteId?: string;
  }>({ isOpen: false, type: "book" });
  const [summaryModal, setSummaryModal] = useState(false);

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

  const handleGenerateSummary = async (preferences: SummaryPreferences) => {
    setIsGenerating(true);
    setError("");
    try {
      const notesText = notes
        .filter((note) => !note.isAISummary)
        .map((note) => note.content)
        .join("\n\n");

      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookTitle: book.title,
          author: book.author,
          notes: notesText || undefined,
          preferences,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nepodařilo se vygenerovat shrnutí");
      }

      const summaryNote: Note = {
        id: generateId(),
        bookId: book.id,
        content: data.summary,
        createdAt: new Date().toISOString(),
        isAISummary: true,
      };

      // Remove any existing AI summaries
      const filteredNotes = notes.filter((note) => !note.isAISummary);
      setNotes([...filteredNotes, summaryNote]);
    } catch (error) {
      console.error("Failed to generate summary:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Nepodařilo se vygenerovat shrnutí. Zkuste to prosím znovu."
      );
    } finally {
      setIsGenerating(false);
      setSummaryModal(false);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setDeleteModal({ isOpen: true, type: "note", noteId });
  };

  const confirmDeleteNote = () => {
    if (deleteModal.noteId) {
      setNotes(notes.filter((note) => note.id !== deleteModal.noteId));
    }
  };

  const handleDelete = () => {
    setDeleteModal({ isOpen: true, type: "book" });
  };

  const confirmDeleteBook = () => {
    window.localStorage.removeItem(`book-${book.id}-notes`);
    onDelete(book.id);
  };

  const regularNotes = notes.filter((note) => !note.isAISummary);
  const aiSummary = notes.find((note) => note.isAISummary);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
      >
        <div className="p-6 hover:bg-gray-50 transition">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex-1 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {book.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{book.author}</p>
            </motion.div>
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.1 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </motion.div>
              <motion.span
                className="text-gray-400 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <ChevronDown className="w-5 h-5" />
              </motion.span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="border-t border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex gap-3 mb-6">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1"
                  >
                    <Button
                      onClick={() => setIsAddingNote(true)}
                      variant="default"
                      className="w-full bg-black hover:bg-gray-800"
                    >
                      <PenLine className="w-4 h-4 mr-2" />
                      Přidat poznámku
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1"
                  >
                    <Button
                      onClick={() => setSummaryModal(true)}
                      disabled={isGenerating}
                      variant="default"
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      {isGenerating
                        ? "Generuji shrnutí..."
                        : "Generovat shrnutí"}
                    </Button>
                  </motion.div>
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {isAddingNote && (
                    <motion.form
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      onSubmit={handleAddNote}
                      className="mb-6"
                    >
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Napiš poznámku..."
                        rows={3}
                        className="w-full text-black px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none mb-2"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="default"
                          onClick={() => setIsAddingNote(false)}
                          className="bg-black hover:bg-gray-800"
                        >
                          Zrušit
                        </Button>
                        <Button
                          type="submit"
                          variant="default"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Uložit poznámku
                        </Button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {aiSummary && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={listItemVariants}
                      className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-blue-600">
                          <Sparkles className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">
                            Shrnutí knihy
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.1 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7"
                            onClick={() => handleDeleteNote(aiSummary.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                      <div className="prose prose-sm max-w-none text-gray-800">
                        <ReactMarkdown>{aiSummary.content}</ReactMarkdown>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {formatDate(aiSummary.createdAt)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <AnimatePresence>
                    {regularNotes.map((note) => (
                      <motion.div
                        key={note.id}
                        variants={listItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="p-4 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-gray-400">
                            {formatDate(note.createdAt)}
                          </div>
                          <motion.div whileHover={{ scale: 1.1 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        </div>
                        <p className="text-gray-800 whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: "book" })}
        onConfirm={
          deleteModal.type === "book" ? confirmDeleteBook : confirmDeleteNote
        }
        title={deleteModal.type === "book" ? "Smazat knihu" : "Smazat poznámku"}
        description={
          deleteModal.type === "book"
            ? "Opravdu chcete smazat tuto knihu a všechny její poznámky? Tuto akci nelze vrátit zpět."
            : "Opravdu chcete smazat tuto poznámku? Tuto akci nelze vrátit zpět."
        }
        confirmText={
          deleteModal.type === "book" ? "Smazat knihu" : "Smazat poznámku"
        }
      />

      <SummaryPreferencesModal
        isOpen={summaryModal}
        onClose={() => setSummaryModal(false)}
        onConfirm={handleGenerateSummary}
        isLoading={isGenerating}
      />
    </>
  );
}
