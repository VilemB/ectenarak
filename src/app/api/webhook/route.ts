import { NextResponse } from "next/server";

// ** Important: Disable Next.js body parsing for this route **
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST() {
  console.log("--- /api/webhook endpoint reached! (Simplified Handler) ---");
  return NextResponse.json({ received: true, status: "simplified_handler_ok" });
}
