import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Author from "@/models/Author";
import {
  generateAuthorSummary,
  DEFAULT_AUTHOR_PREFERENCES,
} from "@/lib/openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkSubscription } from "@/middleware/subscriptionMiddleware";

export async function POST(request: Request) {
  console.log("=== GENERAL AUTHOR SUMMARY API ROUTE START ===");

  try {
    // Connect to the database
    await dbConnect();

    // Check if user has remaining AI credits
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("Unauthorized: No user session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription requirements - verify AI credits
    const subscriptionCheck = await checkSubscription(
      request as unknown as NextRequest,
      {
        requireAiCredits: true,
      }
    );

    if (!subscriptionCheck.allowed) {
      return subscriptionCheck.response as NextResponse;
    }

    const user = subscriptionCheck.user;

    if (!user) {
      console.log("User not found in subscription check");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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

    // If we have an existing summary, return it without using a credit
    if (authorDoc && authorDoc.summary) {
      console.log(`Using existing summary for author: ${author}`);
      return NextResponse.json({
        summary: authorDoc.summary,
        fromCache: true,
      });
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

      // After successful generation, deduct one AI credit
      try {
        const remainingCredits = await user.useAiCredit();
        console.log(`AI credit used. Remaining credits: ${remainingCredits}`);

        console.log("=== GENERAL AUTHOR SUMMARY API ROUTE SUCCESS ===");
        return NextResponse.json({
          summary,
          creditsRemaining: remainingCredits,
        });
      } catch (creditError) {
        console.error("Error deducting AI credit:", creditError);
        return NextResponse.json(
          {
            error: "Došly vám AI kredity",
            creditsRequired: true,
            creditsRemaining: user.subscription?.aiCreditsRemaining || 0,
          },
          { status: 403 }
        );
      }
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
