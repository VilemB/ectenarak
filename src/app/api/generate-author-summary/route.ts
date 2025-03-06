import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Author from "@/models/Author";
import {
  generateAuthorSummary,
  DEFAULT_AUTHOR_PREFERENCES,
} from "@/lib/openai";

export async function POST(request: Request) {
  console.log("=== GENERAL AUTHOR SUMMARY API ROUTE START ===");

  try {
    // Connect to the database
    await dbConnect();

    // Get the author name from the request
    const { author, preferences = DEFAULT_AUTHOR_PREFERENCES } =
      await request.json();

    if (!author) {
      return NextResponse.json(
        { error: "Author name is required" },
        { status: 400 }
      );
    }

    // Check if we already have a summary for this author
    let authorDoc = await Author.findOne({ name: author });

    // If we have an existing summary, return it
    if (authorDoc && authorDoc.summary) {
      console.log(`Using existing summary for author: ${author}`);
      return NextResponse.json({ summary: authorDoc.summary });
    }

    // If the author exists but has no summary, or doesn't exist at all,
    // generate a new summary
    console.log(`Generating new summary for author: ${author}`);

    try {
      // Generate the summary using our shared utility
      const summary = await generateAuthorSummary(author, preferences);
      console.log("Summary generated successfully");

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
      console.log("=== GENERAL AUTHOR SUMMARY API ROUTE SUCCESS ===");

      return NextResponse.json({ summary });
    } catch (error) {
      console.error("Error generating author summary:", error);
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
    console.error("Error in author summary API:", error);
    return NextResponse.json(
      { error: "Failed to generate author summary" },
      { status: 500 }
    );
  }
}
