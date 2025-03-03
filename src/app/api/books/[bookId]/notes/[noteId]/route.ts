import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Book from "@/models/Book";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const { bookId, noteId } = params;

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
    if (book.userId !== session.user.id) {
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
