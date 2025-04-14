import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia" as "2025-03-31.basil",
  typescript: true,
});

// Helper function to construct event from raw body and signature
export async function constructEventFromRequest(
  rawBody: Buffer,
  signature: string | string[] | undefined
) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set in environment variables"
    );
  }

  return stripe.webhooks.constructEvent(
    rawBody,
    signature as string,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}
