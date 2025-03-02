import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Book from "@/models/Book";

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

    await dbConnect();

    // Delete user's books
    await Book.deleteMany({ userId });

    // Delete user account
    const result = await User.findByIdAndDelete(userId);

    if (!result) {
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
