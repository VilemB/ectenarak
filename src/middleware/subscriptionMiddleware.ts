import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

type SubscriptionRequirement = {
  feature?: string;
  requireAiCredits?: boolean;
};

// Define the user document type from mongoose
type UserDocument = mongoose.Document & {
  subscription?: {
    tier: string;
    aiCreditsRemaining: number;
    aiCreditsTotal: number;
  };
  hasAccess(feature: string): boolean;
  hasRemainingAiCredits(): boolean;
  useAiCredit(): Promise<number>;
};

/**
 * Middleware to check user's subscription and feature access
 * @param req The NextRequest object
 * @param requirement Subscription requirements for the route
 */
export async function checkSubscription(
  req: NextRequest,
  requirement: SubscriptionRequirement = {}
): Promise<{
  allowed: boolean;
  response?: NextResponse;
  user?: UserDocument;
}> {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return {
        allowed: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
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
      return {
        allowed: false,
        response: NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        ),
      };
    }

    // Check if a specific feature is required
    if (requirement.feature) {
      if (!user.hasAccess(requirement.feature)) {
        return {
          allowed: false,
          response: NextResponse.json(
            {
              error: "Subscription tier does not include this feature",
              subscriptionRequired: true,
              currentTier: user.subscription?.tier || "free",
            },
            { status: 403 }
          ),
        };
      }
    }

    // Check if AI credits are required
    if (requirement.requireAiCredits) {
      if (!user.hasRemainingAiCredits()) {
        return {
          allowed: false,
          response: NextResponse.json(
            {
              error: "No AI credits remaining",
              creditsRequired: true,
              creditsRemaining: user.subscription?.aiCreditsRemaining || 0,
            },
            { status: 403 }
          ),
        };
      }
    }

    // All checks passed
    return {
      allowed: true,
      user,
    };
  } catch (error) {
    console.error("Error in subscription middleware:", error);
    return {
      allowed: false,
      response: NextResponse.json({ error: "Server error" }, { status: 500 }),
    };
  }
}
