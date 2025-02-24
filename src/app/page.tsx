"use client";

import { useState } from "react";
import { Book } from "@/types";
import BookComponent from "@/components/Book";
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertCircle } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { generateId } from "@/lib/utils";

export default function Home() {
  const [books, setBooks] = useLocalStorage<Book[]>("books", []);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [error, setError] = useState("");

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const title = newBookTitle.trim();
    const author = newBookAuthor.trim();

    if (!title || !author) {
      setError("Prosím vyplňte název knihy a autora");
      return;
    }

    // Check for duplicates
    if (
      books.some(
        (book) =>
          book.title.toLowerCase() === title.toLowerCase() &&
          book.author.toLowerCase() === author.toLowerCase()
      )
    ) {
      setError("Tato kniha od tohoto autora již existuje");
      return;
    }

    const newBook: Book = {
      id: generateId(),
      title: title,
      author: author,
      createdAt: new Date().toISOString(),
    };

    setBooks([...books, newBook]);
    setNewBookTitle("");
    setNewBookAuthor("");
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks(books.filter((book) => book.id !== bookId));
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
          <form onSubmit={handleAddBook} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Název knihy
                </label>
                <div className="relative">
                  <input
                    id="title"
                    type="text"
                    value={newBookTitle}
                    onChange={(e) => {
                      setNewBookTitle(e.target.value);
                      setError("");
                    }}
                    placeholder="Název knihy..."
                    className={`w-full px-4 py-2 border ${
                      error ? "border-red-300" : "border-gray-200"
                    } text-black rounded-lg focus:outline-none focus:ring-2 ${
                      error ? "focus:ring-red-500" : "focus:ring-blue-500"
                    } focus:border-transparent transition`}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="author"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Autor
                </label>
                <div className="relative">
                  <input
                    id="author"
                    type="text"
                    value={newBookAuthor}
                    onChange={(e) => {
                      setNewBookAuthor(e.target.value);
                      setError("");
                    }}
                    placeholder="Jméno autora..."
                    className={`w-full px-4 py-2 border ${
                      error ? "border-red-300" : "border-gray-200"
                    } text-black rounded-lg focus:outline-none focus:ring-2 ${
                      error ? "focus:ring-red-500" : "focus:ring-blue-500"
                    } focus:border-transparent transition`}
                  />
                </div>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                className="min-w-[200px] bg-black hover:bg-gray-800"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Přidat knihu
              </Button>
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
              <BookComponent
                key={book.id}
                book={book}
                onDelete={handleDeleteBook}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
