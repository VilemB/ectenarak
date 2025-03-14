import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Book from "@/models/Book";
import Author from "@/models/Author";
import {
  generateAuthorSummary,
  DEFAULT_AUTHOR_PREFERENCES,
} from "@/lib/openai";
import { AuthorSummaryPreferences } from "@/components/AuthorSummaryPreferencesModal";
import { checkSubscription } from "@/middleware/subscriptionMiddleware";

/**
 * Consolidated API route for author summaries
 * Handles both general author summaries and book-specific summaries
 *
 * Request body:
 * - author: string (required) - The name of the author
 * - preferences: AuthorSummaryPreferences (optional) - Customization preferences
 * - bookId: string (optional) - If provided, associates the summary with this book
 */
export async function POST(req: NextRequest) {
  console.log("=== CONSOLIDATED AUTHOR SUMMARY API ROUTE START ===");

  try {
    // Check subscription requirements
    const subscriptionCheck = await checkSubscription(req, {
      feature: "aiAuthorSummary",
      requireAiCredits: true,
    });

    if (!subscriptionCheck.allowed) {
      return subscriptionCheck.response as NextResponse;
    }

    const user = subscriptionCheck.user;

    // Connect to database
    await dbConnect();

    // Parse request body
    const body = await req.json();
    const { author, preferences = DEFAULT_AUTHOR_PREFERENCES, bookId } = body;

    console.log("Request parameters:", {
      author,
      bookId,
      hasPreferences: !!preferences,
    });

    // Validate author name
    if (!author) {
      return NextResponse.json(
        { error: "Author name is required" },
        { status: 400 }
      );
    }

    // If bookId is provided, handle as book-specific summary
    if (bookId) {
      const result = await handleBookSpecificSummary(
        req,
        author,
        preferences,
        bookId
      );

      // If successful, deduct an AI credit
      if (result.status === 200) {
        await user.useAiCredit();
      }

      return result;
    }

    // Otherwise, handle as general author summary
    const result = await handleGeneralAuthorSummary(author, preferences);

    // If successful, deduct an AI credit
    if (result.status === 200) {
      await user.useAiCredit();
    }

    return result;
  } catch (error) {
    console.error("Error in author summary API:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate author summary",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to remove author summary from a book
 *
 * Query parameters:
 * - bookId: string (required) - The ID of the book to remove the author summary from
 */
export async function DELETE(req: NextRequest) {
  console.log("=== DELETE AUTHOR SUMMARY API ROUTE START ===");

  try {
    // Connect to database
    await dbConnect();

    // Get bookId from URL parameters
    const url = new URL(req.url);
    const bookId = url.searchParams.get("bookId");

    console.log("Request parameters:", { bookId });

    // Validate bookId
    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(bookId)) {
      console.log("Invalid book ID:", bookId);
      return NextResponse.json({ error: "Invalid book ID" }, { status: 400 });
    }

    // Get user session for authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("Unauthorized: No user session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify the book belongs to the user
    const book = await Book.findOne({
      _id: bookId,
      userId: userId,
    });

    if (!book) {
      console.log("Book not found or does not belong to the user");
      return NextResponse.json(
        { error: "Book not found or does not belong to the user" },
        { status: 404 }
      );
    }

    // Check if the book has an author summary
    if (!book.authorSummary) {
      console.log("Book does not have an author summary");
      return NextResponse.json(
        { error: "Book does not have an author summary" },
        { status: 404 }
      );
    }

    // Remove the author summary
    book.authorSummary = undefined;
    await book.save();
    console.log("Author summary removed from book:", bookId);

    return NextResponse.json({
      success: true,
      message: "Author summary removed successfully",
    });
  } catch (error) {
    console.error("Error deleting author summary:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete author summary",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle book-specific author summary generation
 */
async function handleBookSpecificSummary(
  req: NextRequest,
  author: string,
  preferences: AuthorSummaryPreferences,
  bookId: string
) {
  // Get user session for authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    console.log("Unauthorized: No user session found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Validate bookId
  if (!ObjectId.isValid(bookId)) {
    console.log("Invalid book ID:", bookId);
    return NextResponse.json({ error: "Invalid book ID" }, { status: 400 });
  }

  // Verify the book belongs to the user
  const book = await Book.findOne({
    _id: bookId,
    userId: userId,
  });

  if (!book) {
    console.log("Book not found or does not belong to the user");
    return NextResponse.json(
      { error: "Book not found or does not belong to the user" },
      { status: 404 }
    );
  }

  console.log("Book found:", book.title);

  try {
    // Generate author summary
    console.log("Generating book-specific author summary...");
    const summary = await generateAuthorSummary(author, preferences);

    // Update the book with the author summary
    book.authorSummary = summary;
    await book.save();
    console.log("Book updated with author summary");

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating book-specific author summary:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate author summary",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle general author summary generation
 */
async function handleGeneralAuthorSummary(
  author: string,
  preferences: AuthorSummaryPreferences
) {
  // Check if we already have a summary for this author
  let authorDoc = await Author.findOne({ name: author });

  // If we have an existing summary, return it
  if (authorDoc && authorDoc.summary) {
    console.log(`Using existing summary for author: ${author}`);
    return NextResponse.json({ summary: authorDoc.summary });
  }

  try {
    // Generate new summary
    console.log(`Generating new general author summary for: ${author}`);
    const summary = await generateAuthorSummary(author, preferences);

    // Save or update the author in the database
    if (!authorDoc) {
      authorDoc = new Author({
        name: author,
        summary: summary,
      });
    } else {
      authorDoc.summary = summary;
    }

    await authorDoc.save();
    console.log("Author saved to database");

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating general author summary:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate author summary",
      },
      { status: 500 }
    );
  }
}
