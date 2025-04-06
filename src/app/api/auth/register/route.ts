import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Chybí povinné údaje" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "Uživatel s tímto emailem již existuje" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      auth: {
        provider: "local",
      },
      subscription: {
        tier: "free",
        startDate: new Date(),
        isYearly: false,
        aiCreditsTotal: 3,
        aiCreditsRemaining: 3,
        autoRenew: true,
        lastRenewalDate: new Date(),
        nextRenewalDate: new Date(
          new Date().setMonth(new Date().getMonth() + 1)
        ),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    });

    await user.save();

    // Return success but don't include password
    return NextResponse.json(
      {
        message: "Uživatel byl úspěšně vytvořen",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Chyba při registraci uživatele" },
      { status: 500 }
    );
  }
}
