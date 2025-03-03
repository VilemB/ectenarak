import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Book from "@/models/Book";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { bookId: string } }
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

    const { bookId } = await params;

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required" },
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

export async function POST(
  request: Request,
  { params }: { params: { bookId: string } }
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

    const { bookId } = params;
    const { content, isAISummary = false } = await request.json();

    if (!bookId || !content) {
      return NextResponse.json(
        { error: "Book ID and content are required" },
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
