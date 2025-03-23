import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { SubscriptionTier } from "@/types/user";
import mongoose from "mongoose";

/**
 * GET /api/subscription
 * Get the current user's subscription details
 */
export async function GET(_req: NextRequest): Promise<NextResponse> {
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
      // Try finding by OAuth provider ID
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

    // Return the subscription details
    return NextResponse.json({
      subscription: user.subscription || {
        tier: "free",
        startDate: new Date(),
        isYearly: false,
        aiCreditsRemaining: 3,
        aiCreditsTotal: 3,
        autoRenew: false,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscription
 * Update the current user's subscription
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    // Parse the request body
    const body = await req.json();
    const { tier, isYearly } = body;

    // Validate the tier
    if (!tier || !["free", "basic", "premium"].includes(tier)) {
      return NextResponse.json(
        { error: "Invalid subscription tier" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Define the AI credits for each tier
    const AI_CREDITS = {
      free: 3,
      basic: 50,
      premium: 100,
    };

    // Set or update the subscription
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    if (!user.subscription) {
      user.subscription = {
        tier: tier as SubscriptionTier,
        startDate: now,
        isYearly: Boolean(isYearly),
        aiCreditsTotal: AI_CREDITS[tier as SubscriptionTier],
        aiCreditsRemaining: AI_CREDITS[tier as SubscriptionTier],
        autoRenew: true,
        lastRenewalDate: now,
        nextRenewalDate: nextMonth,
      };
    } else {
      // If upgrading subscription, recalculate AI credits
      if (tier !== user.subscription.tier) {
        user.subscription.tier = tier as SubscriptionTier;
        user.subscription.aiCreditsTotal = AI_CREDITS[tier as SubscriptionTier];
        user.subscription.aiCreditsRemaining =
          AI_CREDITS[tier as SubscriptionTier];
      }

      // Update other subscription properties
      if (isYearly !== undefined) {
        user.subscription.isYearly = Boolean(isYearly);
      }

      user.subscription.lastRenewalDate = now;
      user.subscription.nextRenewalDate = nextMonth;
    }

    // Save the user
    await user.save();

    // Return the updated subscription
    return NextResponse.json({ subscription: user.subscription });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscription/use-credit
 * Use one AI credit - This is the same as PUT but works better with fetch in some environments
 */
export async function POST(_req: NextRequest): Promise<NextResponse> {
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
      // Try finding by OAuth provider ID
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
    if (!user.hasRemainingAiCredits()) {
      return NextResponse.json(
        { error: "No AI credits remaining", creditsRemaining: 0 },
        { status: 403 }
      );
    }

    // Use one credit
    const creditsRemaining = await user.useAiCredit();

    // Return the updated credit count
    return NextResponse.json({
      success: true,
      creditsRemaining,
      creditsTotal: user.subscription?.aiCreditsTotal || 0,
    });
  } catch (error) {
    console.error("Error using AI credit:", error);
    return NextResponse.json(
      { error: "Failed to use AI credit" },
      { status: 500 }
    );
  }
}
