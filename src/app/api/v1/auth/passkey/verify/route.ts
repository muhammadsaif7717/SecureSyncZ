import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const isAllowed = checkRateLimit(`passkey_${ip}`, 10, 15 * 60 * 1000); // 10 attempts per 15 mins

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many passkey attempts. Please try again later." },
        { status: 429 }
      );
    }

    const userPayload = await getUserFromRequest(req);

    if (!userPayload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { passkey } = await req.json();

    if (!passkey) {
      return NextResponse.json(
        { error: "Passkey is required" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new ObjectId(userPayload.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.passkey) {
      return NextResponse.json(
        { error: "No passkey set for this user" },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(passkey, user.passkey);

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid passkey" }, { status: 401 });
    }

    return NextResponse.json(
      { success: true, message: "Passkey verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Passkey verification error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
