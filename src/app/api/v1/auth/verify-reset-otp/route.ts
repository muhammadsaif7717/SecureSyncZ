import { connectDB } from "@/lib/connectDB";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const isAllowed = checkRateLimit(
      `verify_reset_otp_${ip}`,
      10,
      15 * 60 * 1000
    );

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const resetTokensCollection = db.collection("reset_tokens");

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

    if (new Date() > new Date(tokenRecord.expiresAt)) {
      await resetTokensCollection.deleteOne({ _id: tokenRecord._id });
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "OTP is valid" }, { status: 200 });
  } catch (error) {
    // console.error("Verify reset OTP error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
