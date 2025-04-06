import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { SubscriptionTier } from "@/types/user";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

/**
 * GET /api/subscription
 * Get the current user's subscription details
 */
export async function GET(): Promise<NextResponse> {
  try {
    console.log("🔄 GET /api/subscription - Getting current subscription data");
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.error("❌ No authenticated user found");
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    console.log(`👤 User ID: ${session.user.id}`);

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
      console.error("❌ User not found in database");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(
      "📊 Found user subscription data:",
      JSON.stringify(
        {
          hasSubscription: !!user.subscription,
          aiCreditsRemaining: user.subscription?.aiCreditsRemaining,
          aiCreditsTotal: user.subscription?.aiCreditsTotal,
          nextRenewalDate: user.subscription?.nextRenewalDate,
        },
        null,
        2
      )
    );

    return NextResponse.json({
      subscription: user.subscription || null,
    });
  } catch (error: any) {
    console.error("❌ Error in subscription API:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
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
