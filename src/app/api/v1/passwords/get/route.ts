import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  try {
    // Get authenticated user from custom JWT token
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { email, username } = user;

    if (!email || !username) {
      return NextResponse.json(
        { error: "User email or username not found in token" },
        { status: 400 }
      );
    }

    // Connect to MongoDB database
    const db = await connectDB();

    // Fetch all password records belonging to this user
    const userPasswords = await db
      .collection("passwords")
      .find({ "user.email": email, "user.username": username })
      .toArray();

    const decryptedPasswords = userPasswords.map((item) => ({
      ...item,
      password: decrypt(item.password),
    }));

    // Return user's filtered password data
    return NextResponse.json(decryptedPasswords, { status: 200 });
  } catch (error) {
    console.error("Error fetching secure passwords data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
