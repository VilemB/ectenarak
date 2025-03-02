import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Book from "@/models/Book";
import Author from "@/models/Author";

export async function GET(request: Request) {
  try {
    // Connect to the database
    await dbConnect();

    // Get the user ID from the query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get all books for the user
    const books = await Book.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json({ books });
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Connect to the database
    await dbConnect();

    // Get book data from the request
    const { userId, title, author } = await request.json();

    if (!userId || !title || !author) {
      return NextResponse.json(
        { error: "User ID, title, and author are required" },
        { status: 400 }
      );
    }

    // Check if the author exists in the database
    let authorDoc = await Author.findOne({ name: author });

    // If the author doesn't exist, create a new one
    if (!authorDoc) {
      authorDoc = new Author({
        name: author,
      });
      await authorDoc.save();
    }

    // Check if the book already exists for this user
    const existingBook = await Book.findOne({
      userId,
      title,
      author,
    });

    if (existingBook) {
      return NextResponse.json(
        { error: "This book already exists in your library" },
        { status: 400 }
      );
    }

    // Create a new book
    const book = new Book({
      userId,
      title,
      author,
      authorId: authorDoc._id,
      notes: [],
    });

    await book.save();

    return NextResponse.json({
      book: {
        id: book._id,
        title: book.title,
        author: book.author,
        authorId: book.authorId,
        notes: book.notes,
        createdAt: book.createdAt,
        authorSummary: authorDoc.summary || null,
      },
    });
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 }
    );
  }
}
