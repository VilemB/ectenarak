import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Author from "@/models/Author";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * DELETE /api/authors/[authorName]/summary
 * Deletes (sets to null) the summary field for a specific author.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ authorName: string }> } // Wrap params in Promise
) {
  console.log("=== DELETE AUTHOR SUMMARY API START ===");
  try {
    // 1. Authentication Check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Optional: Add role check if needed
    // if (session.user.role !== 'admin') { ... }

    // 2. Get Author Name - Await the promise
    const { authorName } = await context.params; // Add await here
    if (!authorName) {
      return NextResponse.json(
        { error: "Author name parameter is missing" },
        { status: 400 }
      );
    }
    const decodedAuthorName = decodeURIComponent(authorName);

    // 3. Connect to DB
    await dbConnect();

    // 4. Find and Update Author
    console.log(
      `Attempting to delete summary for author: ${decodedAuthorName}`
    );
    const updatedAuthor = await Author.findOneAndUpdate(
      { name: decodedAuthorName },
      {
        $set: { summary: null }, // Set summary to null
        $currentDate: { updatedAt: true }, // Update the timestamp
      },
      { new: true } // Return the updated document (optional)
    );

    if (!updatedAuthor) {
      console.log(`Author not found: ${decodedAuthorName}`);
      // Don't treat 'not found' as an error, maybe the summary was already deleted
      return NextResponse.json({
        success: true,
        message: "Author not found or summary already deleted.",
      });
    }

    console.log(
      `Successfully deleted summary for author: ${decodedAuthorName}`
    );
    return NextResponse.json({
      success: true,
      message: "Author summary deleted.",
    });
  } catch (error) {
    console.error("Error deleting author summary:", error);
    return NextResponse.json(
      { error: "Failed to delete author summary" },
      { status: 500 }
    );
  }
}
