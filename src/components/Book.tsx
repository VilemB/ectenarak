"use client";

import { useState } from "react";
import { Book, Note } from "@/types";
import { Button } from "@/components/ui/button";
import {
  PenLine,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Loader2,
  Trash2,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { generateId, formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Modal } from "@/components/ui/modal";

interface BookProps {
  book: Book;
  onDelete: (bookId: string) => void;
}

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

  const handleGenerateSummary = async () => {
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
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="p-6 hover:bg-gray-50 transition">
          <div className="flex items-center justify-between">
            <div
              className="flex-1 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {book.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{book.author}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
              <span
                className="text-gray-400 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-100 p-6">
            <div className="flex gap-3 mb-6">
              <Button
                onClick={() => setIsAddingNote(true)}
                variant="default"
                className="flex-1 bg-black hover:bg-gray-800"
              >
                <PenLine className="w-4 h-4 mr-2" />
                Přidat poznámku
              </Button>
              <Button
                onClick={handleGenerateSummary}
                disabled={isGenerating}
                variant="default"
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {isGenerating ? "Generuji shrnutí..." : "Generovat shrnutí"}
              </Button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {isAddingNote && (
              <form onSubmit={handleAddNote} className="mb-6">
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
              </form>
            )}

            {aiSummary && (
              <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-blue-600">
                    <Sparkles className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Shrnutí knihy</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7"
                    onClick={() => handleDeleteNote(aiSummary.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none text-gray-800">
                  <ReactMarkdown>{aiSummary.content}</ReactMarkdown>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {formatDate(aiSummary.createdAt)}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {regularNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-400">
                      {formatDate(note.createdAt)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
    </>
  );
}
