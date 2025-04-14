import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { SubscriptionTier } from "@/types/user";

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
  console.log("--- /api/webhook endpoint reached! (Simplified Handler) ---");
  return NextResponse.json({ received: true, status: "simplified_handler_ok" });
}
