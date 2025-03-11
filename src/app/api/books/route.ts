import { NextResponse } from "next/server";
import dbConnect, { mockData, isMockConnection } from "@/lib/mongodb";
import Book from "@/models/Book";
import Author from "@/models/Author";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    // Connect to the database
    await dbConnect();

    // Get the query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Filter parameters
    const status = searchParams.get("status");
    const genre = searchParams.get("genre");
    const author = searchParams.get("author");
    const searchTerm = searchParams.get("search");

    // Sort parameters
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    console.log("API: Fetching books for userId:", userId);
    console.log("API: Pagination:", { page, limit });
    console.log("API: Filters:", { status, genre, author, searchTerm });
    console.log("API: Sorting:", { sortBy, sortOrder });

    if (!userId) {
      console.error("API: Missing userId in request");
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // If using mock connection, return mock data
    if (isMockConnection) {
      console.log("API: Using mock data for books");

      // Filter mock books to match the requested userId
      let mockBooksForUser = mockData.books.map((book) => ({
        ...book,
        userId: userId, // Set the userId to match the requested one
      }));

      // Apply filters to mock data
      if (status) {
        mockBooksForUser = mockBooksForUser.filter(
          (book) => book.status === status
        );
      }

      if (genre && genre !== "all") {
        mockBooksForUser = mockBooksForUser.filter(
          (book) => book.genre && book.genre.includes(genre)
        );
      }

      if (author && author !== "all") {
        mockBooksForUser = mockBooksForUser.filter((book) =>
          book.author.toLowerCase().includes(author.toLowerCase())
        );
      }

      if (searchTerm) {
        mockBooksForUser = mockBooksForUser.filter(
          (book) =>
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Sort mock data
      mockBooksForUser.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedBooks = mockBooksForUser.slice(startIndex, endIndex);

      return NextResponse.json({
        books: paginatedBooks,
        pagination: {
          total: mockBooksForUser.length,
          page,
          limit,
          pages: Math.ceil(mockBooksForUser.length / limit),
        },
      });
    }

    // Build query for MongoDB
    const query: Record<string, any> = {};

    // Handle userId - could be ObjectId or string (for OAuth users)
    if (mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = new mongoose.Types.ObjectId(userId);
    } else {
      // If not a valid ObjectId, search in both userId and legacyUserId fields
      query.$or = [{ userId: userId }, { legacyUserId: userId }];
    }

    // Add filters to query
    if (status) {
      query.status = status;
    }

    if (genre && genre !== "all") {
      query.genre = genre;
    }

    if (author && author !== "all") {
      query.author = { $regex: author, $options: "i" };
    }

    if (searchTerm) {
      query.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { author: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // Calculate pagination values
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Book.countDocuments(query);

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Get books with pagination and sorting
    const rawBooks = await Book.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("authorId", "name summary photoUrl");

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

    // Convert to plain objects to ensure we don't send mongoose-specific data
    const cleanBooks = validBooks.map((book) => {
      const plainBook = book.toObject ? book.toObject() : book;
      return {
        _id: plainBook._id.toString(),
        title: plainBook.title,
        author: plainBook.author,
        createdAt: plainBook.createdAt,
        updatedAt: plainBook.updatedAt,
        authorSummary: plainBook.authorSummary || null,
        authorId: plainBook.authorId ? plainBook.authorId.toString() : null,
        userId: plainBook.userId.toString(),
        legacyUserId: plainBook.legacyUserId,
        status: plainBook.status || "not_started",
        isbn: plainBook.isbn,
        publishedYear: plainBook.publishedYear,
        genre: plainBook.genre || [],
        coverImage: plainBook.coverImage,
        description: plainBook.description,
        currentPage: plainBook.currentPage || 0,
        totalPages: plainBook.totalPages,
        readingStartDate: plainBook.readingStartDate,
        readingCompletionDate: plainBook.readingCompletionDate,
        progressPercentage: plainBook.progressPercentage,
        notes: (plainBook.notes || []).map(
          (note: {
            _id: string | { toString(): string };
            content: string;
            createdAt: string | Date;
            isAISummary?: boolean;
            createdBy?: string;
          }) => ({
            _id: note._id.toString(),
            content: note.content,
            createdAt: note.createdAt,
            isAISummary: note.isAISummary || false,
            createdBy: note.createdBy,
          })
        ),
      };
    });

    console.log(`API: Returning ${cleanBooks.length} clean books`);

    // Update user's last active time
    try {
      // Handle userId - could be ObjectId or string (for OAuth users)
      if (mongoose.Types.ObjectId.isValid(userId)) {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        await User.findByIdAndUpdate(userObjectId, {
          "stats.lastActiveAt": new Date(),
        });
      } else {
        // If not a valid ObjectId, try to find the user by email or other means
        await User.findOneAndUpdate(
          { email: userId },
          {
            "stats.lastActiveAt": new Date(),
          }
        );
      }
    } catch (error) {
      console.error("Error updating user's last active time:", error);
      // Continue even if this fails
    }

    return NextResponse.json({
      books: cleanBooks,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
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

    // If using mock connection, return a mock response
    if (isMockConnection) {
      console.log("API: Using mock data for creating a book");

      // Create a mock book
      const mockBook = {
        id: new mongoose.Types.ObjectId().toString(),
        title,
        author,
        authorId: new mongoose.Types.ObjectId().toString(),
        notes: [],
        createdAt: new Date().toISOString(),
        authorSummary: null,
      };

      return NextResponse.json({ book: mockBook });
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
