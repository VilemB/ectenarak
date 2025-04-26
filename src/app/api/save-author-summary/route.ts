import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Author from "@/models/Author";
import { checkSubscription } from "@/middleware/subscriptionMiddleware";

export async function POST(request: NextRequest) {
  console.log("=== SAVE AUTHOR SUMMARY API START ===");
  try {
    const body = await request.json();
    const {
      authorName,
      summary,
      // preferences, // Include if needed for caching or future logic
    } = body;

    if (!authorName || !summary) {
      return NextResponse.json(
        { error: "Missing author name or summary" },
        { status: 400 }
      );
    }

    // 1. Check Authentication & Subscription (crucial for credit deduction)
    const subscriptionCheck = await checkSubscription(request, {
      requireAiCredits: true, // Re-check credits required for the generation action
    });

    if (!subscriptionCheck.allowed) {
      // If checks fail here, the generation already happened, but we can't deduct credit or save.
      // Log this inconsistency. The frontend might have already shown success.
      console.error(
        `Save Author Summary: Subscription/Credit check failed for user ${subscriptionCheck.user?.id} AFTER generation was completed for author '${authorName}'. Summary will not be saved, credit not deducted.`
      );
      // Return an error so frontend knows saving/deduction failed
      return NextResponse.json(
        {
          error:
            "Post-generation check failed. Contact support if credits were used.",
        },
        { status: 403 }
      );
    }

    const user = subscriptionCheck.user;
    // Add explicit check and return if user is somehow not found
    if (!user) {
      console.error(
        `Save Author Summary: User object was unexpectedly null/undefined after successful subscription check. Cannot proceed with save/deduction.`
      );
      // Return an internal server error as this indicates an inconsistency
      return NextResponse.json(
        { error: "Internal server error: User context lost." },
        { status: 500 }
      );
    }

    // 2. Save to Database
    await dbConnect();
    console.log(`Saving author summary for: ${authorName}`);
    let authorDoc = await Author.findOne({ name: authorName });

    if (!authorDoc) {
      authorDoc = new Author({ name: authorName, summary: summary });
    } else {
      authorDoc.summary = summary;
      authorDoc.updatedAt = new Date();
    }

    await authorDoc.save();
    console.log(`Author summary saved successfully for: ${authorName}`);

    // 3. Deduct Credit (Now user is guaranteed to exist here)
    try {
      await user.useAiCredit();
      console.log(`AI credit deducted successfully for author: ${authorName}`);
    } catch (creditError) {
      // Log error, but maybe don't fail the request as saving succeeded.
      console.error(
        `Error deducting AI credit for author ${authorName} after saving summary:`,
        creditError
      );
      // Potentially return a specific status/message if needed
    }

    return NextResponse.json({
      success: true,
      message: "Author summary saved and credit deducted.",
    });
  } catch (error) {
    console.error("Error saving author summary:", error);
    return NextResponse.json(
      { error: "Failed to save author summary" },
      { status: 500 }
    );
  }
}
