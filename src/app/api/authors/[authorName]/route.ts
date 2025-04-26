import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Author from "@/models/Author";

/**
 * GET /api/authors/[authorName]
 * Retrieves author information including summary
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { authorName: string } }
) {
  try {
    // Connect to database
    await dbConnect();

    // Get the author name from the URL parameter and decode it
    const authorName = decodeURIComponent(params.authorName);

    // Find the author in the database
    const authorDoc = await Author.findOne({ name: authorName });

    if (!authorDoc) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    // Return author data with cache control headers to prevent browser caching
    return NextResponse.json(
      {
        id: authorDoc._id,
        name: authorDoc.name,
        summary: authorDoc.summary,
        updatedAt: authorDoc.updatedAt,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching author data:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch author data",
      },
      { status: 500 }
    );
  }
}
