import { NextResponse } from "next/server";
import { constructEventFromRequest, stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { SUBSCRIPTION_LIMITS, SubscriptionTier } from "@/types/user";

// ** Important: Disable Next.js body parsing for this route **
export const config = {
  api: {
    bodyParser: false,
  },
};

// Define Stripe subscription interface properties we need
interface StripeSubscription {
  id: string;
  items: {
    data: Array<{
      price: { id: string };
      plan: { interval: string };
    }>;
  };
  current_period_end: number;
}

// Price ID to Tier mapping (Ensure these match your Stripe Price IDs)
const PRICE_ID_TO_TIER: Record<string, SubscriptionTier> = {
  // Basic
  price_1R2vAHCHqJNxgUwRPpfqCHJF: "basic", // Monthly
  price_1R2vIpCHqJNxgUwRW12zahkB: "basic", // Yearly
  // Premium
  price_1RDOWACHqJNxgUwR1lZD7Ap3: "premium", // Monthly
  price_1RDOWLCHqJNxgUwRjnZbthf9: "premium", // Yearly
};

const getUserCollection = async () => {
  await dbConnect();
  return mongoose.connection.collection("users");
};

export async function POST(req: Request) {
  // ** Read the raw body **
  const buf = await req.arrayBuffer();
  const rawBody = Buffer.from(buf);
  console.log("Webhook handler invoked."); // Log invocation

  try {
    // ** Use the rawBody Buffer for verification **
    const signature = (await headers()).get("stripe-signature") as
      | string
      | null;
    console.log(
      `Received Stripe Signature: ${signature ? signature.substring(0, 10) + "..." : "null"}`
    ); // Log signature (partially)
    console.log(`Raw body length: ${rawBody.length}`); // Log body length

    if (!signature) {
      console.error("Webhook Error: Missing stripe-signature header");
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    console.log("Attempting signature verification..."); // Log before verification
    // ** Use rawBody here instead of the potentially parsed 'body' **
    const event = await constructEventFromRequest(rawBody, signature);
    console.log("Signature verification successful."); // Log after verification

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        // Get the customer and subscription details
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Make sure we have the right metadata
        if (!session.metadata?.userId) {
          console.error("Webhook Error: Missing userId in session metadata");
          return NextResponse.json(
            { error: "Missing userId" },
            { status: 400 }
          );
        }
        const userId = session.metadata.userId;

        // Fetch the subscription details from Stripe
        const subscription = (await stripe.subscriptions.retrieve(
          subscriptionId
        )) as unknown as StripeSubscription;

        // Get data needed for DB update
        const priceId = subscription.items.data[0].price.id;
        const purchasedTier = PRICE_ID_TO_TIER[priceId];
        const nextRenewalDate = new Date(
          subscription.current_period_end * 1000
        );
        const isYearly = subscription.items.data[0].plan.interval === "year";

        if (!purchasedTier) {
          console.error(
            `Webhook Error: Unknown Price ID ${priceId} for user ${userId}`
          );
          return NextResponse.json(
            { error: "Unknown Price ID" },
            { status: 400 }
          );
        }

        // Get the credit limits for the purchased tier
        const credits = SUBSCRIPTION_LIMITS[purchasedTier].aiCreditsPerMonth;

        // Update the user in the database
        const users = await getUserCollection();

        await users.updateOne(
          { _id: new mongoose.Types.ObjectId(userId) },
          {
            $set: {
              "subscription.tier": purchasedTier,
              "subscription.stripeCustomerId": customerId,
              "subscription.stripeSubscriptionId": subscriptionId,
              "subscription.stripePriceId": priceId,
              "subscription.startDate": new Date(), // Set start date on initial purchase
              "subscription.lastRenewalDate": new Date(), // Set last renewal on initial purchase
              "subscription.nextRenewalDate": nextRenewalDate, // Use Stripe's period end
              "subscription.isYearly": isYearly,
              "subscription.autoRenew": true, // Assume paid tiers auto-renew
              "subscription.aiCreditsTotal": credits, // Reset total credits
              "subscription.aiCreditsRemaining": credits, // Reset remaining credits
            },
          }
        );

        console.log(
          `User ${userId} successfully subscribed/upgraded to ${purchasedTier} tier.`
        );
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as unknown as StripeSubscription;

        // Find the user with this subscription ID
        const users = await getUserCollection();
        const user = await users.findOne({
          "subscription.stripeSubscriptionId": subscription.id,
        });

        if (user) {
          // Update subscription details
          await users.updateOne(
            { _id: user._id },
            {
              $set: {
                "subscription.stripePriceId":
                  subscription.items.data[0].price.id,
                "subscription.currentPeriodEnd": new Date(
                  subscription.current_period_end * 1000
                ),
                "subscription.isYearly":
                  subscription.items.data[0].plan.interval === "year",
              },
            }
          );

          console.log(`Updated subscription for user ${user._id}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as unknown as StripeSubscription;

        // Find the user with this subscription ID
        const users = await getUserCollection();
        const user = await users.findOne({
          "subscription.stripeSubscriptionId": subscription.id,
        });

        if (user) {
          // Get limits for the 'free' tier
          const freeTierCredits = SUBSCRIPTION_LIMITS.free.aiCreditsPerMonth;

          // Downgrade the user to free tier and reset credits/dates
          await users.updateOne(
            { _id: user._id },
            {
              $set: {
                "subscription.tier": "free",
                "subscription.stripeCustomerId": null, // Remove Stripe customer ID
                "subscription.stripeSubscriptionId": null, // Remove Stripe subscription ID
                "subscription.stripePriceId": null, // Remove Stripe price ID
                "subscription.startDate":
                  user.subscription?.startDate || new Date(), // Keep original start or set new?
                "subscription.lastRenewalDate": new Date(), // Set renewal date to now
                "subscription.nextRenewalDate": null, // No next renewal for free
                "subscription.isYearly": false, // Free is not yearly
                "subscription.autoRenew": false, // Free does not auto-renew
                "subscription.aiCreditsTotal": freeTierCredits, // Reset total credits
                "subscription.aiCreditsRemaining": freeTierCredits, // Reset remaining credits
              },
            }
          );

          console.log(
            `Webhook: Downgraded user ${user._id} to free tier and reset credits.`
          );
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    // Log the specific signature verification error
    let errorMessage = "Unknown error during webhook processing.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Webhook signature verification failed:", errorMessage);
    console.error("Full Webhook Error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
