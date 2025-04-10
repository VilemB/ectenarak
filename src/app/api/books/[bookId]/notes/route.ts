import { NextResponse } from "next/server";
import dbConnect, { mockData, isMockConnection } from "@/lib/mongodb";
import Book from "@/models/Book";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

// Define interfaces for type safety
interface INote {
  _id: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  isAISummary: boolean;
}

interface IMockBook {
  _id: mongoose.Types.ObjectId;
  title: string;
  author: string;
  notes: INote[];
  userId?: string;
  authorId?: mongoose.Types.ObjectId;
  authorSummary?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown; // For other properties
}

interface RouteParams {
  bookId: string;
}

interface RouteContext {
  params: Promise<RouteParams>;
}

// Helper function to check if the book belongs to the user
function checkBookOwnership(
  book: {
    userId: mongoose.Types.ObjectId | string;
    legacyUserId?: string;
    _doc?: Record<string, unknown>; // For Mongoose document
  },
  userId: string
): boolean {
  // Handle Mongoose document objects
  const bookData = book._doc || book;

  return (
    // Check if userId is an ObjectId and matches session.user.id
    (bookData.userId instanceof mongoose.Types.ObjectId &&
      bookData.userId.toString() === userId) ||
    // Check if userId is a string and matches session.user.id
    (typeof bookData.userId === "string" && bookData.userId === userId) ||
    // Check if legacyUserId matches session.user.id
    (!!bookData.legacyUserId && bookData.legacyUserId === userId)
  );
}

export async function GET(request: Request, context: RouteContext) {
  try {
    // Get the session to verify the user
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    const { bookId } = await context.params;

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      );
    }

    // If using mock connection, return mock data
    if (isMockConnection) {
      console.log("API: Using mock data for notes, bookId:", bookId);

      // Find the mock book with the matching ID
      const mockBook = mockData.books.find(
        (book) => book._id.toString() === bookId
      );

      if (!mockBook) {
        console.log("Book not found in mock data, bookId:", bookId);
        return NextResponse.json({ error: "Book not found" }, { status: 404 });
      }

      // For mock data, we'll skip the user verification
      // This allows any authenticated user to access the mock data
      console.log("Returning mock notes for book:", mockBook.title);
      return NextResponse.json({ notes: mockBook.notes || [] });
    }

    // Get the book to check ownership
    const book = await Book.findById(bookId);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Verify that the book belongs to the current user
    if (!checkBookOwnership(book, session.user.id)) {
      return NextResponse.json(
        { error: "You don't have permission to access notes from this book" },
        { status: 403 }
      );
    }

    // Return the notes
    return NextResponse.json({ notes: book.notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    // Get the session to verify the user
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    const { bookId } = await context.params;
    const { content, isAISummary = false } = await request.json();

    if (!bookId || !content) {
      return NextResponse.json(
        { error: "Book ID and content are required" },
        { status: 400 }
      );
    }

    // If using mock connection, return mock data
    if (isMockConnection) {
      console.log("API: Using mock data for creating a note, bookId:", bookId);

      // Find the mock book with the matching ID
      const mockBookIndex = mockData.books.findIndex(
        (book) => book._id.toString() === bookId
      );

      if (mockBookIndex === -1) {
        return NextResponse.json({ error: "Book not found" }, { status: 404 });
      }

      const mockBook = mockData.books[mockBookIndex] as IMockBook;

      // For mock data, we'll skip the user verification
      // This allows any authenticated user to access the mock data

      // Create a new mock note
      const newNote: INote = {
        _id: new mongoose.Types.ObjectId(),
        content,
        createdAt: new Date(),
        isAISummary,
      };

      // Add the note to the mock book
      if (!mockBook.notes) {
        mockBook.notes = [];
      }

      mockBook.notes.push(newNote);
      console.log("Added mock note to book:", mockBook.title);

      // Return the updated notes
      return NextResponse.json({ notes: mockBook.notes });
    }

    // Get the book to check ownership
    const book = await Book.findById(bookId);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Verify that the book belongs to the current user
    if (!checkBookOwnership(book, session.user.id)) {
      return NextResponse.json(
        { error: "You don't have permission to add notes to this book" },
        { status: 403 }
      );
    }

    // Use the addNote method to add a note to the book
    await book.addNote(content, isAISummary);

    // Return the updated notes
    return NextResponse.json({ notes: book.notes });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
