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

    console.log("API: Fetching books for userId:", userId);

    if (!userId) {
      console.error("API: Missing userId in request");
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get all books for the user
    const rawBooks = await Book.find({ userId }).sort({ createdAt: -1 });

    console.log(`API: Found ${rawBooks.length} raw books for user ${userId}`);

    // Log each book for debugging
    rawBooks.forEach((book, index) => {
      console.log(`API: Book ${index}:`, JSON.stringify(book));
    });

    // Filter out any invalid books with strict validation
    const validBooks = rawBooks.filter((book) => {
      // Check if book exists
      if (!book) {
        console.error("API: Null or undefined book found");
        return false;
      }

      // Check if book is an empty object
      if (Object.keys(book).length === 0) {
        console.error("API: Empty book object found");
        return false;
      }

      // Check if book has an _id
      if (!book._id) {
        console.error("API: Book without _id found:", JSON.stringify(book));
        return false;
      }

      // Check if book has required fields
      if (!book.title || !book.author) {
        console.error(
          "API: Book missing required fields:",
          JSON.stringify(book)
        );
        return false;
      }

      return true;
    });

    console.log(`API: Filtered to ${validBooks.length} valid books`);

    if (validBooks.length !== rawBooks.length) {
      console.warn(
        `API: Filtered out ${rawBooks.length - validBooks.length} invalid books`
      );
    }

    // Convert to plain objects to ensure we don't send mongoose-specific data
    const cleanBooks = validBooks.map((book) => {
      const plainBook = book.toObject ? book.toObject() : book;
      return {
        _id: plainBook._id.toString(),
        title: plainBook.title,
        author: plainBook.author,
        createdAt: plainBook.createdAt,
        authorSummary: plainBook.authorSummary || null,
        authorId: plainBook.authorId ? plainBook.authorId.toString() : null,
        userId: plainBook.userId,
        notes: (plainBook.notes || []).map(
          (note: {
            _id: string | { toString(): string };
            content: string;
            createdAt: string | Date;
            isAISummary?: boolean;
          }) => ({
            _id: note._id.toString(),
            content: note.content,
            createdAt: note.createdAt,
            isAISummary: note.isAISummary || false,
          })
        ),
      };
    });

    console.log(`API: Returning ${cleanBooks.length} clean books`);

    return NextResponse.json({ books: cleanBooks });
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
