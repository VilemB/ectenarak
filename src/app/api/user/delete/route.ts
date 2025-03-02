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

    // Delete user's books using the native MongoDB collection
    await db.collection("books").deleteMany({ userId: userId.toString() });

    // Delete user account
    const userResult = await User.findOneAndDelete({ email: userEmail });

    if (!userResult) {
      return NextResponse.json(
        { message: "Uživatel nebyl nalezen" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Účet byl úspěšně smazán" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user account:", error);
    return NextResponse.json(
      { message: "Chyba při mazání účtu" },
      { status: 500 }
    );
  }
}
