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
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">{book.title}</h2>

      <form onSubmit={handleAddNote} className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add Note
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`p-4 rounded ${
              note.isAISummary
                ? "bg-blue-50 border border-blue-200"
                : "bg-gray-50"
            }`}
          >
            <p className="text-gray-800">{note.content}</p>
            {note.isAISummary && (
              <p className="text-sm text-blue-600 mt-2">AI-Generated Summary</p>
            )}
          </div>
        ))}
      </div>

      {notes.length > 0 && (
        <button
          onClick={handleGenerateSummary}
          disabled={isGenerating}
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isGenerating ? "Generating Summary..." : "Generate Summary"}
        </button>
      )}
    </div>
  );
}
