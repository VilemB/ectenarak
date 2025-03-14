import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

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
      // 1. Delete all user's books (which also deletes embedded notes)
      // Log the number of books deleted for audit purposes
      const booksDeleteResult = await db.collection("books").deleteMany(
        {
          userId: userId.toString(),
        },
        { session: mongoSession }
      );

      console.log(
        `Deleted ${booksDeleteResult.deletedCount} books for user ${userId}`
      );

      // 2. Delete any Author documents created by this user (if applicable)
      // This step depends on your data model - if authors are linked to users
      // await db.collection("authors").deleteMany({ createdBy: userId }, { session: mongoSession });

      // 3. Delete the user account
      const userResult = await User.findOneAndDelete(
        { email: userEmail },
        { session: mongoSession }
      );

      if (!userResult) {
        // Rollback the transaction if user not found
        await mongoSession.abortTransaction();
        return NextResponse.json(
          { message: "Uživatel nebyl nalezen" },
          { status: 404 }
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
