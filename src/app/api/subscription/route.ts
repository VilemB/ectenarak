import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { SubscriptionTier } from "@/types/user";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import Stripe from "stripe";

// Initialize Stripe (Make sure STRIPE_SECRET_KEY is in your .env)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // apiVersion: "2024-06-20" as any,
  typescript: true,
});

/**
 * GET /api/subscription
 * Get the current user's subscription details
 */
export async function GET(): Promise<NextResponse> {
  try {
    // console.log("🔄 GET /api/subscription - Getting current subscription data");
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // console.error("❌ No authenticated user found");
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    // console.log(`👤 User ID: ${session.user.id}`);

    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");

    // Check if ID is a valid MongoDB ObjectId
    let user;
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(session.user.id);

    if (isValidObjectId) {
      // Find by MongoDB _id
      user = await usersCollection.findOne({
        _id: new ObjectId(session.user.id),
      });
    }

    // If not found or not a valid ObjectId, try finding by OAuth ID
    if (!user) {
      user = await usersCollection.findOne({
        providerId: session.user.id,
      });
    }

    // Last resort - try email
    if (!user && session.user.email) {
      user = await usersCollection.findOne({
        email: session.user.email,
      });
    }

    if (!user) {
      // console.error("❌ User not found in database");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // console.log(
    //   "📊 Found user subscription data:",
    //   JSON.stringify(
    //     {
    //       hasSubscription: !!user.subscription,
    //       aiCreditsRemaining: user.subscription?.aiCreditsRemaining,
    //       aiCreditsTotal: user.subscription?.aiCreditsTotal,
    //       nextRenewalDate: user.subscription?.nextRenewalDate,
    //     },
    //     null,
    //     2
    //   )
    // );

    return NextResponse.json({
      subscription: user.subscription || null,
    });
  } catch (error: Error | unknown) {
    // console.error("❌ Error in subscription API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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
 * DELETE /api/subscription
 * Mark the user's Stripe subscription to cancel at the end of the period.
 */
export async function DELETE(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Find the user, ensuring we get the subscription details including Stripe ID
    const user = await User.findById(session.user.id).select(
      "+subscription.stripeSubscriptionId"
    );

    if (!user || !user.subscription?.stripeSubscriptionId) {
      console.error(
        `User ${session.user.id} not found or missing Stripe Subscription ID.`
      );
      return NextResponse.json(
        { error: "Subscription not found or cannot be cancelled." },
        { status: 404 }
      );
    }

    // --- Update Stripe Subscription ---
    try {
      await stripe.subscriptions.update(
        user.subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        }
      );
      console.log(
        `[Cancel Sub] Stripe subscription ${user.subscription.stripeSubscriptionId} marked for cancellation at period end.`
      );
    } catch (stripeError) {
      console.error(
        `[Cancel Sub] Stripe API error for user ${session.user.id}:`,
        stripeError
      );
      // Don't fail the whole request if Stripe update fails, but log it.
      // We can still update our local flag.
      // Consider adding more robust error handling/retries if needed.
    }

    // --- Update Local User Record ---
    user.subscription.cancelAtPeriodEnd = true;
    await user.save();
    console.log(
      `[Cancel Sub] Local user record ${session.user.id} updated with cancelAtPeriodEnd=true.`
    );

    // Return the updated subscription status
    return NextResponse.json({
      message: "Subscription scheduled for cancellation at period end.",
      subscription: user.subscription,
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Failed to schedule subscription cancellation" },
      { status: 500 }
    );
  }
}
