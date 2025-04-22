import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";
import Stripe from "stripe";

// Initialize Stripe (ensure STRIPE_SECRET_KEY is in your .env)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { message: "Nejste přihlášeni" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json(
        { message: "Email uživatele nebyl nalezen" },
        { status: 404 }
      );
    }

    await dbConnect();

    // Use the native MongoDB driver to bypass Mongoose's schema validation
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection not established");
    }

    // Start a session for transactional operations
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      // --- Fetch User and Attempt Stripe Subscription Cancellation ---
      const userToDelete = await User.findOne({ email: userEmail })
        .select("+subscription.stripeSubscriptionId") // Ensure we get the Stripe ID
        .session(mongoSession); // Run find within the transaction

      if (!userToDelete) {
        await mongoSession.abortTransaction();
        mongoSession.endSession();
        return NextResponse.json(
          { message: "Uživatel nebyl nalezen" },
          { status: 404 }
        );
      }

      // Check if user has an active Stripe subscription and cancel it
      if (userToDelete.subscription?.stripeSubscriptionId) {
        const stripeSubId = userToDelete.subscription.stripeSubscriptionId;
        console.log(
          `[Delete User] User ${userEmail} has Stripe subscription ${stripeSubId}. Attempting cancellation.`
        );
        try {
          await stripe.subscriptions.cancel(stripeSubId);
          console.log(
            `[Delete User] Successfully cancelled Stripe subscription ${stripeSubId} for user ${userEmail}.`
          );
        } catch (stripeError) {
          console.error(
            `[Delete User] Failed to cancel Stripe subscription ${stripeSubId} for user ${userEmail}. Proceeding with DB deletion. Error:`,
            stripeError
          );
          // Log the error but do not abort the transaction.
          // We still want to delete the user's data even if Stripe fails.
        }
      } else {
        console.log(
          `[Delete User] User ${userEmail} does not have an active Stripe subscription ID.`
        );
      }

      // --- Proceed with deleting user data from DB ---

      // First, get the list of books for this user
      // This helps us identify which author summaries are linked to the user's books
      const userBooks = await db
        .collection("books")
        .find(
          { userId: userId.toString() },
          { projection: { author: 1, authorId: 1 } }
        )
        .toArray();

      console.log(`Found ${userBooks.length} books for user ${userId}`);

      // Extract author IDs from the user's books
      const authorIds = userBooks
        .filter((book) => book.authorId)
        .map((book) => book.authorId);

      // If we have author IDs, delete those author documents
      if (authorIds.length > 0) {
        // Convert string IDs to ObjectId if necessary
        const objectIdAuthorIds = authorIds.map((id) =>
          typeof id === "string" ? new mongoose.Types.ObjectId(id) : id
        );

        const authorsDeleteResult = await db
          .collection("authors")
          .deleteMany(
            { _id: { $in: objectIdAuthorIds } },
            { session: mongoSession }
          );

        console.log(
          `Deleted ${authorsDeleteResult.deletedCount} author summaries for user ${userId}`
        );
      }

      // Delete all user's books (which also deletes embedded notes)
      const booksDeleteResult = await db
        .collection("books")
        .deleteMany({ userId: userId.toString() }, { session: mongoSession });

      console.log(
        `Deleted ${booksDeleteResult.deletedCount} books for user ${userId}`
      );

      // Delete the user account
      // We use deleteOne now since we already fetched the user
      const userResult = await User.deleteOne(
        { _id: userToDelete._id }, // Use the ID we found
        { session: mongoSession }
      );

      if (userResult.deletedCount === 0) {
        // This shouldn't happen if we found the user above, but added as a safeguard
        await mongoSession.abortTransaction();
        return NextResponse.json(
          { message: "Nepodařilo se smazat uživatelský záznam" },
          { status: 500 }
        );
      }

      // Commit the transaction if everything succeeded
      await mongoSession.commitTransaction();

      console.log(`Successfully deleted user account: ${userEmail}`);

      return NextResponse.json(
        { message: "Účet byl úspěšně smazán" },
        { status: 200 }
      );
    } catch (error) {
      // Rollback on error
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      mongoSession.endSession();
    }
  } catch (error) {
    console.error("Error deleting user account:", error);
    return NextResponse.json(
      { message: "Chyba při mazání účtu" },
      { status: 500 }
    );
  }
}
