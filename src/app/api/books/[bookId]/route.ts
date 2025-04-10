import { NextResponse } from "next/server";
import dbConnect, { mockData, isMockConnection } from "@/lib/mongodb";
import Book from "@/models/Book";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

interface RouteParams {
  bookId: string;
}

interface RouteContext {
  params: Promise<RouteParams>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
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
      console.log("API: Using mock data for individual book, bookId:", bookId);

      // Find the mock book with the matching ID
      const mockBook = mockData.books.find(
        (book) => book._id.toString() === bookId
      );

      if (!mockBook) {
        console.log("Book not found in mock data, bookId:", bookId);
        return NextResponse.json({ error: "Book not found" }, { status: 404 });
      }

      console.log("Returning mock book:", mockBook.title);
      return NextResponse.json({
        book: {
          id: mockBook._id,
          title: mockBook.title,
          author: mockBook.author,
          authorId: mockBook.authorId || null,
          notes: mockBook.notes || [],
          createdAt: mockBook.createdAt,
          userId: mockBook.userId,
        },
      });
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

export async function DELETE(request: Request, context: RouteContext) {
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
      console.log("API: Using mock data for deleting a book, bookId:", bookId);

      // Find the mock book with the matching ID
      const mockBookIndex = mockData.books.findIndex(
        (book) => book._id.toString() === bookId
      );

      if (mockBookIndex === -1) {
        console.log("Book not found in mock data, bookId:", bookId);
        // Return success even if the book doesn't exist
        return NextResponse.json({ message: "Book deleted successfully" });
      }

      const mockBook = mockData.books[mockBookIndex];

      // For mock data, we'll skip the user verification
      // This allows any authenticated user to access the mock data

      // Remove the book from the mock data
      mockData.books.splice(mockBookIndex, 1);
      console.log("Deleted mock book:", mockBook.title);

      return NextResponse.json({ message: "Book deleted successfully" });
    }

    // Get the book to check ownership
    const book = await Book.findById(bookId);

    // If the book doesn't exist, consider it already deleted and return success
    if (!book) {
      console.log(`Book ${bookId} not found, considering it already deleted`);
      return NextResponse.json({ message: "Book deleted successfully" });
    }

    // Verify that the book belongs to the current user
    const bookData = book._doc || book;
    const userIdMatches =
      // Check if userId is an ObjectId and matches session.user.id
      (bookData.userId instanceof mongoose.Types.ObjectId &&
        bookData.userId.toString() === session.user.id) ||
      // Check if userId is a string and matches session.user.id
      (typeof bookData.userId === "string" &&
        bookData.userId === session.user.id) ||
      // Check if legacyUserId matches session.user.id
      (!!bookData.legacyUserId && bookData.legacyUserId === session.user.id);

    if (!userIdMatches) {
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

export async function PATCH(request: Request, context: RouteContext) {
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
    const { bookId } = await context.params;

    if (!bookId || bookId === "undefined") {
      return NextResponse.json(
        { error: "Valid Book ID is required" },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await request.json();

    // If using mock connection, return mock data
    if (isMockConnection) {
      console.log("API: Using mock data for updating a book, bookId:", bookId);

      // Find the mock book with the matching ID
      const mockBookIndex = mockData.books.findIndex(
        (book) => book._id.toString() === bookId
      );

      if (mockBookIndex === -1) {
        console.log("Book not found in mock data, bookId:", bookId);
        return NextResponse.json({ error: "Book not found" }, { status: 404 });
      }

      const mockBook = mockData.books[mockBookIndex];

      // For mock data, we'll skip the user verification
      // This allows any authenticated user to access the mock data

      // Update the mock book
      const updatedBook = {
        ...mockBook,
        ...body,
      };

      mockData.books[mockBookIndex] = updatedBook;
      console.log("Updated mock book:", updatedBook.title);

      return NextResponse.json({
        message: "Book updated successfully",
        book: {
          id: updatedBook._id,
          title: updatedBook.title,
          author: updatedBook.author,
          authorId: updatedBook.authorId || null,
          authorSummary: updatedBook.authorSummary || null,
          notes: updatedBook.notes || [],
          createdAt: updatedBook.createdAt,
          userId: updatedBook.userId,
        },
      });
    }

    // Get the book to check ownership
    const book = await Book.findById(bookId);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Verify that the book belongs to the current user
    const bookData = book._doc || book;
    const userIdMatches =
      // Check if userId is an ObjectId and matches session.user.id
      (bookData.userId instanceof mongoose.Types.ObjectId &&
        bookData.userId.toString() === session.user.id) ||
      // Check if userId is a string and matches session.user.id
      (typeof bookData.userId === "string" &&
        bookData.userId === session.user.id) ||
      // Check if legacyUserId matches session.user.id
      (!!bookData.legacyUserId && bookData.legacyUserId === session.user.id);

    if (!userIdMatches) {
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
