import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"; // Assuming you use NextAuth.js
import { authOptions } from "@/lib/auth"; // Corrected import path
import dbConnect from "@/lib/mongodb";
import User from "@/models/User"; // Adjust path to your User model

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch the user from the database using the ID from the session
    // Ensure your User model and query select all necessary fields, especially 'subscription'
    const userProfile = await User.findById(session.user.id).lean(); // .lean() for plain JS object

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // IMPORTANT: Sanitize userProfile before sending if needed.
    // Do not send sensitive data like password hashes.
    // Your User.findById().select('-password') or similar in the model might handle this.
    // For this example, we assume the 'userProfile' is safe to send after DB query.
    // If not, create a DTO or manually pick fields.

    // Convert Date objects to ISO strings if they aren't already, or ensure client handles
    // various date formats. Mongoose .lean() might return them as Date objects.
    // JSON.stringify will convert Dates to ISO strings automatically.

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching current user session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
