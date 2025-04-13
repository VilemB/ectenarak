import { NextResponse } from "next/server";
import { constructEventFromRequest, stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

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

const getUserCollection = async () => {
  await dbConnect();
  return mongoose.connection.collection("users");
};

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature") as
      | string
      | null;

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const event = await constructEventFromRequest(Buffer.from(body), signature);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        // Get the customer and subscription details
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Make sure we have the right metadata
        if (session.metadata?.userId) {
          // Fetch the subscription details
          const subscription = (await stripe.subscriptions.retrieve(
            subscriptionId
          )) as unknown as StripeSubscription;

          // Get subscription data
          const priceId = subscription.items.data[0].price.id;
          const currentPeriodEnd = new Date(
            subscription.current_period_end * 1000
          );
          const isYearly = subscription.items.data[0].plan.interval === "year";

          // Update the user in the database
          const users = await getUserCollection();

          await users.updateOne(
            { _id: new mongoose.Types.ObjectId(session.metadata.userId) },
            {
              $set: {
                "subscription.tier": "premium",
                "subscription.stripeCustomerId": customerId,
                "subscription.stripeSubscriptionId": subscriptionId,
                "subscription.stripePriceId": priceId,
                "subscription.currentPeriodEnd": currentPeriodEnd,
                "subscription.isYearly": isYearly,
              },
            }
          );

          console.log(
            `User ${session.metadata.userId} upgraded to premium subscription`
          );
        }
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
          // Downgrade the user to free tier
          await users.updateOne(
            { _id: user._id },
            {
              $set: {
                "subscription.tier": "free",
                "subscription.currentPeriodEnd": new Date(),
              },
            }
          );

          console.log(`Downgraded user ${user._id} to free tier`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
