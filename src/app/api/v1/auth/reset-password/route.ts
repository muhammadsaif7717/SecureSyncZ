import { connectDB } from "@/lib/connectDB";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const isAllowed = checkRateLimit(`reset_${ip}`, 5, 15 * 60 * 1000); // 5 attempts per 15 mins

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, OTP, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const resetTokensCollection = db.collection("reset_tokens");

    // Find the token
    const tokenRecord = await resetTokensCollection.findOne({
      email: email.toLowerCase(),
      otp: otp,
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Invalid or incorrect OTP" },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > new Date(tokenRecord.expiresAt)) {
      await resetTokensCollection.deleteOne({ _id: tokenRecord._id });
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Update the password
    const usersCollection = db.collection("users");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updateResult = await usersCollection.updateOne(
      { email: email.toLowerCase() },
      { $set: { password: hashedPassword } }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete the used token
    await resetTokensCollection.deleteOne({ _id: tokenRecord._id });

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
