import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { SUBSCRIPTION_LIMITS, SubscriptionTier } from "@/types/user"; // Assuming UserSubscription type is defined here or adjust import

// Define the structure of the user document we need for the update
interface UserForCreditReset {
  _id: mongoose.Types.ObjectId;
  subscription?: {
    tier: SubscriptionTier;
    aiCreditsRemaining: number;
    aiCreditsTotal: number;
  };
}

const getUserCollection = async () => {
  await dbConnect();
  // Define the schema structure minimally for type safety if not using a full model here
  const UserSchema = new mongoose.Schema(
    {
      subscription: {
        tier: String,
        aiCreditsRemaining: Number,
        aiCreditsTotal: Number,
        // Add other subscription fields if needed for other operations, but keep it minimal
      },
      // Define other top-level user fields if necessary
    },
    { strict: false }
  ); // Use strict: false if the schema isn't fully defined

  // Try getting the existing model, otherwise define it
  return (
    mongoose.models.User ||
    mongoose.model<UserForCreditReset>("User", UserSchema)
  );
};

// Read the secret from environment variables ONCE
const EXPECTED_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  console.log("Attempting to run monthly credit reset cron job...");

  if (!EXPECTED_SECRET) {
    console.error(
      "CRON_SECRET environment variable is not set. Cannot verify request."
    );
    // Don't reveal that the secret is missing, just return unauthorized
    return NextResponse.json({ error: "Configuration error" }, { status: 500 });
  }

  // Extract the last segment of the path which should be the secret
  const pathname = request.nextUrl.pathname;
  const pathSegments = pathname.split("/");
  // Handle potential trailing slash by filtering empty segments
  const actualSegments = pathSegments.filter((segment) => segment.length > 0);
  const receivedSecret = actualSegments[actualSegments.length - 1];

  if (receivedSecret !== EXPECTED_SECRET) {
    console.warn("Unauthorized attempt to run cron job. Path secret mismatch.");
    // Log details for debugging, but be cautious in production
    console.log("Received Path:", pathname);
    console.log("Received Secret Segment:", receivedSecret);
    // Avoid logging the expected secret in production logs if possible
    // console.log("Expected Secret Segment:", EXPECTED_SECRET);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log(
    "Authorization successful (path matched). Proceeding with credit reset."
  );

  try {
    await dbConnect();
    const User = await getUserCollection();

    const usersToReset = (await User.find({
      "subscription.tier": { $in: ["basic", "premium"] },
    })
      .select("subscription.tier subscription.aiCreditsTotal")
      .lean()) as UserForCreditReset[]; // Select only needed fields

    console.log(
      `Found ${usersToReset.length} users with basic/premium subscriptions to reset credits for.`
    );

    if (usersToReset.length === 0) {
      return NextResponse.json({
        message: "No users found requiring credit reset.",
      });
    }

    const bulkOps = usersToReset
      .map((user) => {
        if (!user.subscription) {
          console.warn(
            `User ${user._id} matched query but has no subscription object. Skipping.`
          );
          return null; // Skip users somehow matching but missing subscription
        }
        const tier = user.subscription.tier;
        const creditsForTier = SUBSCRIPTION_LIMITS[tier]?.aiCreditsPerMonth;

        if (typeof creditsForTier !== "number") {
          console.warn(
            `User ${user._id} has tier ${tier} but no credit limit defined in SUBSCRIPTION_LIMITS. Skipping.`
          );
          return null; // Skip if limit isn't defined
        }

        console.log(
          `User ${user._id}: Tier ${tier}, resetting credits to ${creditsForTier}`
        );

        return {
          updateOne: {
            filter: { _id: user._id },
            update: {
              $set: { "subscription.aiCreditsRemaining": creditsForTier },
            },
          },
        };
      })
      .filter((op) => op !== null); // Remove null operations

    if (bulkOps.length > 0) {
      console.log(`Performing bulk update for ${bulkOps.length} users...`);
      const result = await User.bulkWrite(bulkOps);
      console.log("Bulk write result:", result);
      return NextResponse.json({
        message: `Successfully reset credits for ${result.modifiedCount} users.`,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      });
    } else {
      console.log("No valid operations to perform after filtering.");
      return NextResponse.json({
        message: "No users required credit updates after filtering.",
      });
    }
  } catch (error) {
    console.error("Error during cron job execution:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to reset credits.", details: errorMessage },
      { status: 500 }
    );
  }
}
