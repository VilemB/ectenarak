import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Book from "@/models/Book";

export async function GET(
  request: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    // Connect to the database
    await dbConnect();

    const { bookId } = params;

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      );
    }

    // Get the book
    const book = await Book.findById(bookId);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
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

    // Get the book
    const book = await Book.findById(bookId);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Create a new note
    const note = {
      content,
      createdAt: new Date(),
      isAISummary,
    };

    // Add the note to the book
    book.notes.push(note);
    await book.save();

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
