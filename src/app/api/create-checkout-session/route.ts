import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";

// Initialize Stripe with your secret key (load from .env in a real app)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil", // User mentioned this was a workaround, seems string is an acceptable type
  typescript: true,
});

// Define a mapping from your app's tier/billing cycle to Stripe Price IDs
// Replace these with your actual Stripe Price IDs from your Stripe Dashboard
const STRIPE_PRICE_IDS: Record<string, Record<string, string>> = {
  basic: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID || "",
    yearly: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID || "",
  },
  premium: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID || "",
    yearly: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID || "",
  },
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id || !session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized or missing user email" },
        { status: 401 }
      );
    }

    const { tier, isYearly } = await request.json();

    if (tier === "free") {
      return NextResponse.json(
        { error: "Cannot create checkout session for free tier" },
        { status: 400 }
      );
    }

    if (
      !tier ||
      typeof isYearly !== "boolean" ||
      !STRIPE_PRICE_IDS[tier as string]
    ) {
      return NextResponse.json(
        { error: "Missing or invalid tier or isYearly parameter" },
        { status: 400 }
      );
    }

    const priceTier = STRIPE_PRICE_IDS[tier as string];
    const priceId = isYearly ? priceTier.yearly : priceTier.monthly;

    if (!priceId || !priceId.startsWith("price_")) {
      console.error(
        `Configured Stripe Price ID "${priceId}" is a placeholder or invalid. Please replace it with a real Price ID from your Stripe Dashboard.`
      );
      return NextResponse.json(
        {
          error:
            "Stripe Price ID is not configured correctly. Placeholder or invalid ID detected.",
        },
        { status: 500 }
      );
    }

    // Get base URL for success/cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const stripeSessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription/cancel`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
        newTier: tier,
        newIsYearly: String(isYearly),
      },
    };

    const stripeSession =
      await stripe.checkout.sessions.create(stripeSessionParams);

    // Return either the redirect URL (for Stripe Hosted Checkout) or just the session ID (if using custom flow/Elements)
    return NextResponse.json({
      sessionId: stripeSession.id,
      url: stripeSession.url,
    });
  } catch (error: unknown) {
    console.error("Error creating Stripe checkout session:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create checkout session";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
