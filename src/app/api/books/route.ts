import { NextResponse } from "next/server";
import dbConnect, { mockData, isMockConnection } from "@/lib/mongodb";
import Book from "@/models/Book";
import Author from "@/models/Author";
import User from "@/models/User";
import mongoose from "mongoose";
import { SUBSCRIPTION_LIMITS } from "@/types/user";
// Import SubscriptionTier explicitly for casting
import { SubscriptionTier } from "@/types/user";

// Define a type for mock books with only the fields we need
interface MockBook {
  _id: mongoose.Types.ObjectId;
  title: string;
  author: string;
  authorId: mongoose.Types.ObjectId;
  authorSummary: string | null;
  createdAt: Date;
  userId: string;
  notes: Array<{
    _id: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
    isAISummary: boolean;
  }>;
  [key: string]: unknown; // Allow indexing with string for sorting
}

export async function GET(request: Request) {
  try {
    // Connect to the database
    await dbConnect();

    // Get the query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const userEmail = searchParams.get("email");
    const debugId = searchParams.get("debugId");

    // Debug information
    if (debugId) {
      try {
        JSON.parse(decodeURIComponent(debugId)); // Parse but don't assign if unused
        // const debug = JSON.parse(decodeURIComponent(debugId)); // Removed unused variable
        // console.log("API DEBUG - User info:", debug); // Remove log
      } catch (e) {
        console.error("API DEBUG - Failed to parse debug info:", e);
      }
    }

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Filter parameters
    const author = searchParams.get("author");
    const searchTerm = searchParams.get("search");

    // Sort parameters
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // console.log("API: Fetching books for userId:", userId); // Remove log
    // console.log("API: Pagination:", { page, limit }); // Remove log
    // console.log("API: Filters:", { author, searchTerm }); // Remove log
    // console.log("API: Sorting:", { sortBy, sortOrder }); // Remove log

    if (!userId) {
      console.error("API: Missing userId in request");
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // If using mock connection, return mock data
    if (isMockConnection) {
      // console.log("API: Using mock data for books"); // Remove log

      // Filter mock books to match the requested userId
      let mockBooksForUser = mockData.books.map((book) => ({
        ...book,
        userId: userId, // Set the userId to match the requested one
      })) as MockBook[];

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
          return String(aValue) > String(bValue) ? 1 : -1;
        } else {
          return String(aValue) < String(bValue) ? 1 : -1;
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
    const query: Record<string, unknown> = {};

    // Enhanced userId handling to catch all possible formats from NextAuth
    if (userId) {
      // console.log( // Remove log
      //   `API: Using userId format: ${typeof userId}, value: ${userId}`
      // );

      // Build the $or query to try all possible ID formats
      const orConditions = [];

      // Add ID-based conditions
      if (mongoose.Types.ObjectId.isValid(userId)) {
        orConditions.push({ userId: new mongoose.Types.ObjectId(userId) });
      }
      orConditions.push({ userId: userId });
      orConditions.push({ legacyUserId: userId });
      orConditions.push({ "auth.providerId": userId });

      // Add email-based conditions if available
      if (userEmail) {
        // console.log(`API: Also trying with email: ${userEmail}`); // Remove log
        orConditions.push({ email: userEmail });
        orConditions.push({ userEmail: userEmail });
      }

      // Set the query
      query.$or = orConditions;

      // console.log("API: Final query:", JSON.stringify(query)); // Remove log
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

    console.log(
      `[Books API] Found ${rawBooks.length} raw books for user ${userId}. Checking population...`
    );

    // Log the populated author details for the first few books (if they exist)
    for (let i = 0; i < Math.min(rawBooks.length, 3); i++) {
      const book = rawBooks[i];
      if (book && book.authorId) {
        // Check if authorId is populated (is an object)
        if (
          typeof book.authorId === "object" &&
          book.authorId !== null &&
          "_id" in book.authorId
        ) {
          // Define a type for the populated author fields we expect
          type PopulatedAuthor = {
            _id: mongoose.Types.ObjectId | string; // ID field
            name?: string;
            summary?: string;
            photoUrl?: string;
          };
          // Log the populated authorId field directly
          console.log(
            `[Books API] Book ${i + 1} (${book.title}) - Populated authorId:`,
            JSON.stringify(book.authorId)
          );
          // Explicitly check for summary within the populated object
          const populatedAuthor = book.authorId as PopulatedAuthor;
          console.log(
            `[Books API] Book ${i + 1} - Populated author summary length: ${populatedAuthor?.summary?.length ?? "N/A"}`
          );
        } else {
          // Log if authorId is just an ID (population might have failed or wasn't an object)
          console.log(
            `[Books API] Book ${i + 1} (${book.title}) - authorId is not a populated object:`,
            book.authorId
          );
        }
      } else {
        console.log(
          `[Books API] Book ${i + 1} (${book.title}) - Missing book or authorId for population check.`
        );
      }
    }

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

    // console.log(`API: Returning ${cleanBooks.length} clean books`); // Remove log

    // Update user's last active time
    try {
      // Handle userId - could be ObjectId or string (for OAuth users)
      if (mongoose.Types.ObjectId.isValid(userId)) {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        await User.findByIdAndUpdate(userObjectId, {
          lastLoginAt: new Date(),
        });
      } else {
        // If not a valid ObjectId, try to find the user by email or other means
        await User.findOneAndUpdate(
          { email: userId },
          {
            lastLoginAt: new Date(),
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
    await dbConnect();
    const { userId, title, author } = await request.json();

    if (!userId || !title || !author) {
      return NextResponse.json(
        { error: "User ID, title, and author are required" },
        { status: 400 }
      );
    }

    // --- Add Book Limit Check ---
    // console.log(`[Add Book] Checking limits for user: ${userId}`); // Remove log
    // Fetch the full user document first
    const user = await User.findById(userId);

    if (!user) {
      console.error(`[Add Book] User not found for ID: ${userId}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the tier, default to free
    const userTierValue = user.subscription?.tier || "free";
    // Cast the value to SubscriptionTier before using it as an index
    const userTier = userTierValue as SubscriptionTier;

    const maxBooks = SUBSCRIPTION_LIMITS[userTier].maxBooks;
    // console.log(`[Add Book] User tier: ${userTier}, Max books: ${maxBooks}`); // Remove log

    // Only check limit if not premium (Infinity)
    if (maxBooks !== Infinity) {
      // Use userId directly here, it's confirmed valid
      const currentBookCount = await Book.countDocuments({ userId: userId });
      // console.log(`[Add Book] Current book count: ${currentBookCount}`); // Remove log

      if (currentBookCount >= maxBooks) {
        console.warn(
          `[Add Book] Limit reached for user ${userId} (Tier: ${userTier}, Limit: ${maxBooks})`
        );
        return NextResponse.json(
          {
            error: "Limit knih dosažen",
            message: `Váš aktuální plán (${userTier}) povoluje maximálně ${maxBooks} knih. Pro přidání dalších knih si prosím upgradujte plán.`,
            limit: maxBooks,
            tier: userTier,
            limitReached: true,
          },
          { status: 403 } // 403 Forbidden is appropriate for plan limits
        );
      }
    }
    // --- End Book Limit Check ---

    // If using mock connection, return a mock response
    if (isMockConnection) {
      // console.log("API: Using mock data for creating a book"); // Remove log

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

    // --- Update User document with the new book ID ---
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const updatedUser = await User.findByIdAndUpdate(
        userObjectId,
        { $push: { books: book._id } },
        { new: true, useFindAndModify: false }
      );

      // Log the result to see if Mongoose believes the update happened
      if (updatedUser) {
        // console.log( // Remove log
        //   `[Add Book] User.findByIdAndUpdate successful for user ${userId}. Returned user books array:`,
        //   JSON.stringify(updatedUser.books)
        // );
        if (
          !updatedUser.books
            .map((id: mongoose.Types.ObjectId) => id.toString())
            .includes(book._id.toString())
        ) {
          console.error(
            `[Add Book] CRITICAL: Update seemed successful but book ${book._id} not found in returned user.books!`
          );
        }
      } else {
        console.error(
          `[Add Book] User.findByIdAndUpdate did not return an updated document for user ${userId}.`
        );
      }
    } catch (userUpdateError) {
      console.error(
        `[Add Book] Failed to add book ${book._id} to user ${userId} after book creation:`,
        userUpdateError
      );
      // Decide how to handle this error. Options:
      // 1. Continue and return success (book created, user link failed - may cause inconsistency)
      // 2. Try to delete the created book for atomicity (more complex)
      // 3. Return an error indicating partial failure
      // For now, we'll log the error and continue, but this might need refinement.
    }
    // --- End User Update ---

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
