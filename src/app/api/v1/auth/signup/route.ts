import { connectDB } from "@/lib/connectDB";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const isAllowed = checkRateLimit(`signup_${ip}`, 5, 15 * 60 * 1000); // 5 attempts per 15 mins

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 }
      );
    }

    let { username, email, password, encryptedValidationStr } =
      await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    username = username.trim();
    email = email.trim();

    const db = await connectDB();
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: "User already exists with this email" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Username already registered" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = {
      username: username,
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
      encryptedValidationStr: encryptedValidationStr || null,
      createdAt: new Date().toISOString(),
      isPremium: false,
      subscriptionExpiry: null,
      playStorePurchaseToken: null,
    };

    const result = await usersCollection.insertOne(newUser);
    const userId = result.insertedId.toString();

    // Sign JWT
    const token = await signToken({
      id: userId,
      email: newUser.email,
      username: newUser.username,
    });

    // Set JWT in HttpOnly cookie
    const response = NextResponse.json(
      {
        message: "User signed up successfully",
        user: {
          id: userId,
          email: newUser.email,
          username: newUser.username,
          hasPasskey: false,
          isVerified: false,
          encryptedValidationStr: newUser.encryptedValidationStr,
        },
      },
      { status: 201 }
    );

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    // console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
