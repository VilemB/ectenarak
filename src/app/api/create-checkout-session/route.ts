import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log("Received body in /api/create-checkout-session:", body);
    const { priceId } = body;

    if (!priceId) {
      console.error(
        "Error creating checkout session: Price ID is required but was missing."
      );
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 }
      );
    }

    // Get base URL from request headers
    const origin =
      (await headers()).get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL ||
      "http://localhost:3000";

    // Create the checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscription`,
      customer_email: session.user.email || undefined,
      metadata: {
        userId: session.user.id,
      },
    });

    // Return the session ID instead of the full URL
    return NextResponse.json({ id: checkoutSession.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
