import { NextResponse } from "next/server";
import { constructEventFromRequest, stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { SUBSCRIPTION_LIMITS, SubscriptionTier } from "@/types/user";
import Stripe from "stripe"; // Import the official Stripe type

// ** Important: Disable Next.js body parsing for this route **
// This config export is generally not needed/supported in App Router
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// Price ID to Tier mapping (Ensure these match your Stripe Price IDs)
// USER ACTION: Verify these EXACTLY match your LIVE Stripe Price IDs!
const PRICE_ID_TO_TIER: Record<string, SubscriptionTier> = {
  // Basic Monthly - Replace with your actual LIVE ID
  price_REPLACE_WITH_LIVE_BASIC_MONTHLY_ID: "basic",
  // Basic Yearly - Replace with your actual LIVE ID
  price_REPLACE_WITH_LIVE_BASIC_YEARLY_ID: "basic",
  // Premium Monthly - Replace with your actual LIVE ID
  price_REPLACE_WITH_LIVE_PREMIUM_MONTHLY_ID: "premium",
  // Premium Yearly - Replace with your actual LIVE ID
  price_REPLACE_WITH_LIVE_PREMIUM_YEARLY_ID: "premium",
};

const getUserCollection = async () => {
  await dbConnect();
  return mongoose.connection.collection("users");
};

export async function POST(req: Request) {
  // **** ADDED VERY EARLY LOG ****
  console.log("!!! /api/webhook POST function START !!!");
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

        // Log extracted IDs
        console.log(
          `[Webhook] Extracted customerId: ${customerId}, subscriptionId: ${subscriptionId}`
        );

        console.log(
          `[Webhook] Checkout completed for sub ID: ${subscriptionId}`
        ); // Log Sub ID

        // Make sure we have the right metadata
        if (!session.metadata?.userId) {
          console.error("Webhook Error: Missing userId in session metadata");
          return NextResponse.json(
            { error: "Missing userId" },
            { status: 400 }
          );
        }
        const userId = session.metadata.userId;

        // Check if subscriptionId is actually valid before retrieving
        if (!subscriptionId || typeof subscriptionId !== "string") {
          console.error(
            `[Webhook] Invalid or missing subscription ID from session: ${subscriptionId}`
          );
          return NextResponse.json(
            { error: "Invalid subscription ID in session" },
            { status: 400 }
          );
        }

        try {
          // Add try...catch around the Stripe call
          // Fetch the subscription details from Stripe
          const retrievedSubscription: Stripe.Subscription = // Use official Stripe type
            await stripe.subscriptions.retrieve(subscriptionId);
          // Log the RAW object BEFORE casting/validation
          console.log(
            `[Webhook] RAW retrieved Stripe Sub for ${subscriptionId}:`,
            JSON.stringify(retrievedSubscription, null, 2)
          );

          // Validate the structure again, specifically for the nested property
          if (
            !retrievedSubscription.items?.data?.[0] ||
            typeof retrievedSubscription.items.data[0].current_period_end !==
              "number"
          ) {
            console.error(
              `[Webhook] Retrieved Stripe subscription object for ${subscriptionId} is missing items.data[0].current_period_end.`
            );
            return NextResponse.json(
              { error: "Invalid subscription item data received from Stripe." },
              { status: 500 }
            );
          }

          console.log(
            `[Webhook] current_period_end from Validated Stripe Sub Item: ${retrievedSubscription.items.data[0].current_period_end}`
          );

          // ** Validate the timestamp and calculate nextRenewalDate **
          const nextRenewalTimestamp =
            retrievedSubscription.items.data[0].current_period_end; // Use validated data from the item

          let nextRenewalDate: Date | null = null;
          // Check the potentially undefined timestamp
          if (
            nextRenewalTimestamp &&
            typeof nextRenewalTimestamp === "number" &&
            nextRenewalTimestamp > 0
          ) {
            try {
              nextRenewalDate = new Date(nextRenewalTimestamp * 1000);
              // Check if the resulting date is valid
              if (isNaN(nextRenewalDate.getTime())) {
                console.error(
                  `[Webhook] Failed to create valid date from timestamp: ${nextRenewalTimestamp}`
                );
                nextRenewalDate = null; // Set to null if date creation failed
              }
            } catch (dateError) {
              console.error(
                `[Webhook] Error creating date from timestamp: ${nextRenewalTimestamp}`,
                dateError
              );
              nextRenewalDate = null; // Set to null on error
            }
          } else {
            // Add detailed logging before the warning check
            // Log the CASTED object here to see what caused the undefined check
            console.log(
              "[Webhook] Object being checked for current_period_end:",
              JSON.stringify(retrievedSubscription, null, 2)
            );
            console.warn(
              `[Webhook] Invalid or missing current_period_end timestamp received from item: ${nextRenewalTimestamp}. Setting nextRenewalDate to null.`
            );
          }

          // Log the calculated date (conditionally)
          console.log(
            `[Webhook] Calculated nextRenewalDate for DB: ${nextRenewalDate instanceof Date ? nextRenewalDate.toISOString() : "null"}`
          );

          // Get data needed for DB update
          const priceId = retrievedSubscription.items.data[0].price.id;
          const purchasedTier = PRICE_ID_TO_TIER[priceId];
          const isYearly =
            retrievedSubscription.items.data[0].plan.interval === "year";

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

          console.log(
            `[Webhook] Attempting DB update for user ${userId} with nextRenewalDate: ${nextRenewalDate instanceof Date ? nextRenewalDate.toISOString() : "null"}`
          );

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
                "subscription.cancelAtPeriodEnd": false, // Ensure this is false initially
              },
            }
          );

          console.log(
            `User ${userId} successfully subscribed/upgraded to ${purchasedTier} tier.`
          );
        } catch (stripeError) {
          console.error(
            `[Webhook] Error retrieving Stripe subscription ${subscriptionId}:`,
            stripeError
          );
          // Decide how to handle this - maybe return an error response?
          return NextResponse.json(
            { error: "Failed to retrieve subscription from Stripe" },
            { status: 500 }
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        // Use the official Stripe type here too for consistency
        const subscriptionUpdate = event.data.object as Stripe.Subscription;

        // Add validation similar to checkout.session.completed if needed
        if (!subscriptionUpdate || !subscriptionUpdate.id) {
          console.error(
            "[Webhook Update] Invalid subscription object in event data."
          );
          return NextResponse.json(
            { error: "Invalid event data" },
            { status: 400 }
          );
        }

        console.log(
          "[Webhook Update] Processing update for subscription ID:",
          subscriptionUpdate.id
        );
        // Log the object received in the update event
        console.log(
          "[Webhook Update] Received subscription object:",
          JSON.stringify(subscriptionUpdate, null, 2)
        );

        // Find the user with this subscription ID
        const users = await getUserCollection();
        const user = await users.findOne({
          "subscription.stripeSubscriptionId": subscriptionUpdate.id,
        });

        if (user) {
          try {
            // Directly use properties from the validated subscriptionUpdate object
            const newPriceId = subscriptionUpdate.items.data[0]?.price?.id;
            const planInterval =
              subscriptionUpdate.items.data[0]?.plan?.interval;
            const cancelAtPeriodEnd = subscriptionUpdate.cancel_at_period_end; // Get cancellation status

            // Validate access to the nested property on the update object too
            if (
              !subscriptionUpdate.items?.data?.[0] ||
              typeof subscriptionUpdate.items.data[0].current_period_end !==
                "number"
            ) {
              console.error(
                `[Webhook Update] Subscription update object for ${subscriptionUpdate.id} is missing items.data[0].current_period_end.`
              );
              return NextResponse.json(
                { error: "Invalid subscription item data in update event." },
                { status: 400 }
              );
            }
            const nextRenewalTimestamp =
              subscriptionUpdate.items.data[0].current_period_end;

            // Ensure necessary data exists before proceeding
            if (!newPriceId || !planInterval) {
              console.error(
                `[Webhook Update] Missing price ID or plan interval for subscription ${subscriptionUpdate.id}`
              );
              // Decide how to handle: return error or skip update?
              return NextResponse.json(
                { error: "Missing required subscription item data" },
                { status: 400 }
              );
            }

            const updatedTier = PRICE_ID_TO_TIER[newPriceId];
            const isYearly = planInterval === "year";

            // Validate timestamp before creating Date
            let nextRenewalDateForUpdate: Date | null = null;
            if (
              nextRenewalTimestamp &&
              typeof nextRenewalTimestamp === "number" &&
              nextRenewalTimestamp > 0
            ) {
              try {
                nextRenewalDateForUpdate = new Date(
                  nextRenewalTimestamp * 1000
                );
                if (isNaN(nextRenewalDateForUpdate.getTime())) {
                  console.error(
                    `[Webhook Update] Failed to create valid date from timestamp: ${nextRenewalTimestamp}`
                  );
                  nextRenewalDateForUpdate = null;
                }
              } catch (dateError) {
                console.error(
                  `[Webhook Update] Error creating date from timestamp: ${nextRenewalTimestamp}`,
                  dateError
                );
                nextRenewalDateForUpdate = null;
              }
            } else {
              console.warn(
                `[Webhook Update] Invalid or missing current_period_end timestamp received from item: ${nextRenewalTimestamp}. Setting nextRenewalDateForUpdate to null.`
              );
              // Already null by default
            }

            if (!updatedTier) {
              console.error(
                `Webhook Update Error: Unknown Price ID ${newPriceId} for user ${user._id}`
              );
              // Potentially return error or just log and continue?
              // For now, just log and maybe skip tier/credit update.
            } else {
              const credits =
                SUBSCRIPTION_LIMITS[updatedTier].aiCreditsPerMonth;

              await users.updateOne(
                { _id: user._id },
                {
                  $set: {
                    "subscription.tier": updatedTier,
                    "subscription.stripePriceId": newPriceId,
                    "subscription.nextRenewalDate": nextRenewalDateForUpdate, // Use validated date
                    "subscription.isYearly": isYearly,
                    "subscription.aiCreditsTotal": credits,
                    "subscription.aiCreditsRemaining": credits,
                    "subscription.lastRenewalDate": new Date(),
                    "subscription.cancelAtPeriodEnd": cancelAtPeriodEnd, // Use validated cancellation status
                  },
                }
              );
              console.log(
                `Webhook: Updated subscription for user ${user._id} to tier ${updatedTier}. Cancel at period end: ${cancelAtPeriodEnd}` // Log cancellation status
              );
            }
          } catch (dbError) {
            console.error(
              `Webhook DB Error updating subscription for user ${user._id}:`,
              dbError
            );
          }
        } else {
          // It's possible an update event might not have the full data, log it here too
          console.log(
            "[Webhook] Subscription object from 'customer.subscription.updated' event data:",
            JSON.stringify(subscriptionUpdate, null, 2)
          );
          console.warn(
            `[Webhook] Received subscription update for unknown subscription ID: ${subscriptionUpdate.id}`
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        // Use the official Stripe type
        const subscriptionDelete = event.data.object as Stripe.Subscription;

        // Add validation
        if (!subscriptionDelete || !subscriptionDelete.id) {
          console.error(
            "[Webhook Delete] Invalid subscription object in event data."
          );
          return NextResponse.json(
            { error: "Invalid event data" },
            { status: 400 }
          );
        }

        console.log(
          "[Webhook Delete] Processing delete for subscription ID:",
          subscriptionDelete.id
        );

        // Find the user with this subscription ID
        const users = await getUserCollection();
        const user = await users.findOne({
          "subscription.stripeSubscriptionId": subscriptionDelete.id,
        });

        if (user) {
          try {
            const freeTierCredits = SUBSCRIPTION_LIMITS.free.aiCreditsPerMonth;
            const updateResult = await users.updateOne(
              { _id: user._id },
              {
                $set: {
                  "subscription.tier": "free",
                  "subscription.stripeCustomerId": null,
                  "subscription.stripeSubscriptionId": null,
                  "subscription.stripePriceId": null,
                  "subscription.startDate":
                    user.subscription?.startDate || new Date(),
                  "subscription.lastRenewalDate": new Date(),
                  "subscription.nextRenewalDate": null, // Explicitly setting null
                  "subscription.isYearly": false,
                  "subscription.autoRenew": false,
                  "subscription.aiCreditsTotal": freeTierCredits,
                  "subscription.aiCreditsRemaining": freeTierCredits,
                  "subscription.cancelAtPeriodEnd": false, // Ensure this is false on downgrade
                },
              }
            );
            // Add log confirming DB update result
            console.log(
              `[Webhook] Completed DB update for deleted sub for user ${user._id}. Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`
            );
          } catch (dbError) {
            console.error(
              `Webhook DB Error deleting subscription for user ${user._id}:`,
              dbError
            );
          }
        } else {
          console.warn(
            `Webhook: Received subscription deletion for unknown subscription ID: ${subscriptionDelete.id}`
          );
        }
        break;
      }

      default:
        console.log(`Webhook: Unhandled event type ${event.type}`);
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
