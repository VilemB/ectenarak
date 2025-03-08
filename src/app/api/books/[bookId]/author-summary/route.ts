import { NextRequest, NextResponse } from "next/server";
import dbConnect, { mockData, isMockConnection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Book from "@/models/Book";
import { generateAuthorSummary } from "@/lib/openai";

export async function POST(
  req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  console.log("=== AUTHOR SUMMARY API ROUTE START ===");
  console.log(`Received request for book ID: ${params.bookId}`);

  try {
    console.log("Author summary API route called with bookId:", params.bookId);

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key is not configured");
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("Unauthorized: No user session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const bookId = params.bookId;
    console.log("User ID:", userId);

    // Validate bookId
    if (!bookId || !ObjectId.isValid(bookId)) {
      console.log("Invalid book ID:", bookId);
      return NextResponse.json({ error: "Invalid book ID" }, { status: 400 });
    }

    // Parse request body
    const body = await req.json();
    const { author, preferences } = body;
    console.log("Author:", author);
    console.log("Preferences:", preferences);

    if (!author) {
      console.log("Missing author name");
      return NextResponse.json(
        { error: "Author name is required" },
        { status: 400 }
      );
    }

    // Connect to database
    console.log("Connecting to database...");
    await dbConnect();
    console.log("Connected to database");

    // If using mock connection, return mock data
    if (isMockConnection) {
      console.log("API: Using mock data for author summary, bookId:", bookId);

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

      // Generate a mock author summary
      const mockSummary = `${author} byl významný český spisovatel, novinář a překladatel. Narodil se v roce 1890 a zemřel v roce 1938. Je známý především svými díly jako jsou R.U.R., Válka s mloky, Bílá nemoc a mnoho dalších. Jeho díla často obsahují prvky science fiction a varují před nebezpečím totalitarismu a technologického pokroku bez etických zábran.`;

      // Update the mock book with the author summary
      mockData.books[mockBookIndex].authorSummary = mockSummary;

      console.log(
        "Mock author summary generated successfully for book:",
        mockBook.title
      );
      console.log("=== AUTHOR SUMMARY API ROUTE SUCCESS (MOCK) ===");

      return NextResponse.json({ summary: mockSummary });
    }

    // Verify the book belongs to the user
    console.log("Finding book in database...");
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

    // Generate author summary using the shared utility
    console.log("Generating author summary...");
    try {
      const summary = await generateAuthorSummary(author, preferences);
      console.log("Author summary generated successfully");

      // Update the book with the author summary
      console.log("Updating book with author summary...");
      book.authorSummary = summary;
      await book.save();
      console.log("Book updated successfully");

      console.log("=== AUTHOR SUMMARY API ROUTE SUCCESS ===");
      return NextResponse.json({ summary });
    } catch (error) {
      console.error("Error in summary generation:", error);
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
  } catch (error) {
    console.error("Error generating author summary:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to generate author summary";
    console.error("Error message:", errorMessage);
    console.log("=== AUTHOR SUMMARY API ROUTE ERROR ===");
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
