import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import User from "@/models/User"; // Make sure this path is correct for your User model

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { priceId: targetPriceId } = await req.json();

    if (!targetPriceId) {
      return NextResponse.json(
        { error: "Target Price ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the user and their current Stripe subscription ID
    const user = await User.findById(session.user.id).select(
      "subscription.stripeSubscriptionId"
    );

    if (!user?.subscription?.stripeSubscriptionId) {
      console.error(
        "User does not have an active Stripe subscription to update:",
        session.user.id
      );
      return NextResponse.json(
        { error: "No active subscription found to update" },
        { status: 404 }
      );
    }

    const currentSubscriptionId = user.subscription.stripeSubscriptionId;

    // Retrieve the current subscription to get the item ID
    const currentSubscription = await stripe.subscriptions.retrieve(
      currentSubscriptionId
    );
    const currentItemId = currentSubscription.items.data[0]?.id;

    if (!currentItemId) {
      console.error(
        "Could not find item ID on current subscription:",
        currentSubscriptionId
      );
      return NextResponse.json(
        { error: "Subscription item not found" },
        { status: 500 }
      );
    }

    // Update the subscription on Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscriptionId,
      {
        items: [
          {
            id: currentItemId, // Specify the item ID to update
            price: targetPriceId, // Set the new price ID
          },
        ],
        proration_behavior: "create_prorations", // Enable proration calculation
        // cancel_at_period_end: false, // Default for upgrades
      }
    );

    console.log(
      `Stripe subscription ${currentSubscriptionId} update request sent for user ${session.user.id} to price ${targetPriceId}`
    );

    // Return success, the webhook will handle the actual DB update
    return NextResponse.json({
      success: true,
      subscriptionId: updatedSubscription.id,
    });
  } catch (error: unknown) {
    console.error("Error updating subscription:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update subscription";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
