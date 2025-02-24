"use client";

import { useState } from "react";
import { Book, Note } from "@/types";
import { Button } from "@/components/ui/button";
import { PenLine, Sparkles, ChevronDown, ChevronRight } from "lucide-react";

interface BookProps {
  book: Book;
}

export default function BookComponent({ book }: BookProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      bookId: book.id,
      content: newNote,
      createdAt: new Date(),
    };

    setNotes([...notes, note]);
    setNewNote("");
    setIsAddingNote(false);
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const notesText = notes.map((note) => note.content).join("\n\n");

      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookTitle: book.title,
          notes: notesText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();

      const summaryNote: Note = {
        id: Date.now().toString(),
        bookId: book.id,
        content: data.summary,
        createdAt: new Date(),
        isAISummary: true,
      };

      setNotes([...notes, summaryNote]);
    } catch (error) {
      console.error("Failed to generate summary:", error);
      alert("Nepodařilo se vygenerovat shrnutí. Zkuste to prosím znovu.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div
        className="p-6 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {book.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {notes.length} poznámek
            </p>
          </div>
          <span className="text-gray-400">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 p-6">
          <div className="flex gap-3 mb-6">
            <Button
              onClick={() => setIsAddingNote(true)}
              variant="outline"
              className="flex-1"
            >
              <PenLine className="w-4 h-4 mr-2" />
              Přidat poznámku
            </Button>
            <Button
              onClick={handleGenerateSummary}
              disabled={isGenerating || notes.length === 0}
              variant="outline"
              className="flex-1"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? "Generuji shrnutí..." : "Generovat shrnutí"}
            </Button>
          </div>

          {isAddingNote && (
            <form onSubmit={handleAddNote} className="mb-6">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Napiš poznámku..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none mb-2"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddingNote(false)}
                >
                  Zrušit
                </Button>
                <Button type="submit">Uložit poznámku</Button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`p-4 rounded-lg ${
                  note.isAISummary
                    ? "bg-blue-50 border border-blue-100"
                    : "bg-gray-50 border border-gray-100"
                }`}
              >
                <p className="text-gray-800 whitespace-pre-wrap">
                  {note.content}
                </p>
                {note.isAISummary && (
                  <div className="flex items-center mt-2 text-blue-600">
                    <Sparkles className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">
                      Generované shrnutí
                    </span>
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(note.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
