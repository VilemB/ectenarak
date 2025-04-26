import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Author from "@/models/Author";

/**
 * GET /api/authors/[authorName]
 * Retrieves author information including summary
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ authorName: string }> }
) {
  try {
    // Connect to database
    await dbConnect();

    // Get the author name from the URL parameter and decode it
    const { authorName } = await context.params;

    // Find the author in the database
    const author = await Author.findOne({
      name: decodeURIComponent(authorName),
    });

    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    // Return author data with cache control headers to prevent browser caching
    return NextResponse.json(author, {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error fetching author:", error);
    return NextResponse.json(
      { error: "Failed to fetch author information" },
      { status: 500 }
    );
  }
}
