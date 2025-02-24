"use client";

import { useState } from "react";
import { Book, Note } from "@/types";

interface BookProps {
  book: Book;
}

export default function BookComponent({ book }: BookProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

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
      alert("Failed to generate summary. Please try again.");
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
              {notes.length} note{notes.length !== 1 ? "s" : ""}
            </p>
          </div>
          <span className="text-gray-400">
            {isExpanded ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 p-6">
          <form onSubmit={handleAddNote} className="mb-6">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Napiš poznámku..."
              rows={3}
              className="text-black w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out"
              >
                Přidej poznámku
              </button>
            </div>
          </form>

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
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
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

          {notes.length > 0 && (
            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generuji shrnutí...
                </>
              ) : (
                "Generuj shrnutí"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
