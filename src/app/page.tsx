"use client";

import { useState } from "react";
import { Book } from "@/types";
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
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900">Čtenářský deník</h1>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Přidej novou knihu
          </h2>
          <form onSubmit={handleAddBook}>
            <div className="flex gap-4">
              <input
                type="text"
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                placeholder="Název knihy + autor..."
                className="flex-1 px-4 py-2 border text-black border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
              >
                Přidej knihu
              </button>
            </div>
          </form>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">
              Žádné knihy nejsou přidány. Začněte přidáváním své první knihy!
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {books.map((book) => (
              <BookComponent key={book.id} book={book} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
