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

    return NextResponse.json({
      book: {
        id: book._id,
        title: book.title,
        author: book.author,
        authorId: book.authorId,
        notes: book.notes,
        createdAt: book.createdAt,
        userId: book.userId,
      },
    });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        { error: "You don't have permission to delete this book" },
        { status: 403 }
      );
    }

    // Delete the book
    await Book.findByIdAndDelete(bookId);

    return NextResponse.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json(
      { error: "Failed to delete book" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Properly handle the bookId parameter
    const bookId = params.bookId;

    if (!bookId || bookId === "undefined") {
      return NextResponse.json(
        { error: "Valid Book ID is required" },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await request.json();

    // Get the book to check ownership
    const book = await Book.findById(bookId);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Verify that the book belongs to the current user
    if (book.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to update this book" },
        { status: 403 }
      );
    }

    // Update the book
    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      { $set: body },
      { new: true }
    );

    return NextResponse.json({
      message: "Book updated successfully",
      book: {
        id: updatedBook._id,
        title: updatedBook.title,
        author: updatedBook.author,
        authorId: updatedBook.authorId,
        authorSummary: updatedBook.authorSummary,
        notes: updatedBook.notes,
        createdAt: updatedBook.createdAt,
        userId: updatedBook.userId,
      },
    });
  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 }
    );
  }
}
