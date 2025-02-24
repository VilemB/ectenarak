"use client";

import { useState } from "react";
import { Book, Note } from "@/types";
import BookComponent from "@/components/Book";

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [newBookTitle, setNewBookTitle] = useState("");

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;

    const newBook: Book = {
      id: Date.now().toString(),
      title: newBookTitle,
      createdAt: new Date(),
    };

    setBooks([...books, newBook]);
    setNewBookTitle("");
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Reader&apos;s Journal</h1>

        <form onSubmit={handleAddBook} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={newBookTitle}
              onChange={(e) => setNewBookTitle(e.target.value)}
              placeholder="Enter book title"
              className="flex-1 p-2 border rounded"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Book
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {books.map((book) => (
            <BookComponent key={book.id} book={book} />
          ))}
        </div>
      </div>
    </main>
  );
}
