import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Book from "@/models/Book";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

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

export async function DELETE(
  request: Request,
  { params }: { params: { bookId: string; noteId: string } }
) {
  try {
    // Get the session to verify the user
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    const { bookId, noteId } = await params;

    if (!bookId || !noteId) {
      return NextResponse.json(
        { error: "Book ID and Note ID are required" },
        { status: 400 }
      );
    }

    // Get the book to check ownership
    const book = await Book.findById(bookId);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Verify that the book belongs to the current user
    if (!checkBookOwnership(book, session.user.id)) {
      return NextResponse.json(
        { error: "You don't have permission to delete notes from this book" },
        { status: 403 }
      );
    }

    // Use the removeNote method to remove the note
    await book.removeNote(noteId);

    // Return the updated notes
    return NextResponse.json({ notes: book.notes });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
