import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User"; // Make sure this path is correct
import Stripe from "stripe";

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

    console.log(
      `[update-subscription] Fetching user with ID: ${session.user.id}`
    );
    // Define a minimal expected type
    type UserLean = {
      _id: string;
      subscription?: { stripeSubscriptionId?: string | null };
    } | null;

    // Fetch, convert to plain object, and assert type
    const user = (await User.findById(session.user.id)
      .select("subscription.stripeSubscriptionId")
      .lean()) as UserLean;

    // Log the plain JavaScript object
    console.log("[update-subscription] Fetched user data (Lean obj):", user);

    // Check if user exists before accessing properties
    if (!user) {
      console.error(
        `[update-subscription] User not found with ID: ${session.user.id}`
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safely access the nested property from the plain object
    const currentSubscriptionId = user?.subscription?.stripeSubscriptionId;

    if (!currentSubscriptionId) {
      console.error(
        "[update-subscription] User object or stripeSubscriptionId missing AFTER .lean().",
        { userId: session.user.id, userData: user }
      );
      return NextResponse.json(
        { error: "No active subscription found to update" },
        { status: 404 }
      );
    }

    console.log(
      `[update-subscription] Found current Stripe Sub ID: ${currentSubscriptionId}`
    );

    // Retrieve the current subscription from Stripe using the found ID
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

    // Explicitly type the proration_behavior property
    const updatePayload: Stripe.SubscriptionUpdateParams = {
      items: [
        {
          id: currentItemId,
          price: targetPriceId,
        },
      ],
      proration_behavior: "create_prorations" as const, // Use 'as const' or specific literal type
    };

    console.log(
      `[update-subscription] Attempting to update Stripe sub ${currentSubscriptionId} with payload:`,
      JSON.stringify(updatePayload, null, 2)
    );

    // Update the subscription on Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscriptionId,
      updatePayload
    );

    console.log(
      `Stripe subscription ${currentSubscriptionId} update request SENT for user ${session.user.id} to price ${targetPriceId}`
    );

    // Return success, the webhook will handle the actual DB update
    return NextResponse.json({
      success: true,
      subscriptionId: updatedSubscription.id,
    });
  } catch (error: unknown) {
    console.error("[update-subscription] Error during processing:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update subscription";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// NOTE: We removed the config export { api: { bodyParser: false } }
// because this simple handler doesn't need the raw body.
// We'll add it back later if needed.
