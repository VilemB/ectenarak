import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

/**
 * Common handler function for using one AI credit
 * This avoids duplicate code and fixes the unused parameter warning
 */
async function handleUseAiCredit(): Promise<NextResponse> {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    // Find the user - try different lookup methods to handle both MongoDB IDs and OAuth IDs
    let user;

    // First, check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(session.user.id);

    if (isValidObjectId) {
      // Try finding the user by MongoDB _id
      user = await User.findById(session.user.id);
    }

    // If user wasn't found and it's not a valid ObjectId, or if we need a fallback
    if (!user) {
      // Try finding by OAuth provider ID or email
      user = await User.findOne({
        $or: [
          { "auth.providerId": session.user.id },
          { email: session.user.email },
        ],
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has remaining credits
    if (!user.subscription || user.subscription.aiCreditsRemaining <= 0) {
      return NextResponse.json(
        { error: "No AI credits remaining", creditsRemaining: 0 },
        { status: 403 }
      );
    }

    // Use one credit
    user.subscription.aiCreditsRemaining -= 1;
    await user.save();

    // Return the updated credit count
    return NextResponse.json({
      success: true,
      creditsRemaining: user.subscription.aiCreditsRemaining,
      creditsTotal: user.subscription.aiCreditsTotal || 0,
    });
  } catch (error) {
    console.error("Error using AI credit:", error);
    return NextResponse.json(
      { error: "Failed to use AI credit" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/subscription/use-credit
 * Use one AI credit
 */
export async function PUT(): Promise<NextResponse> {
  return handleUseAiCredit();
}

/**
 * POST /api/subscription/use-credit
 * Alternative method for use-credit that works better with some fetch implementations
 */
export async function POST(): Promise<NextResponse> {
  return handleUseAiCredit();
}
