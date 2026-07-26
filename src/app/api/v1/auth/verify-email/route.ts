import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const isAllowed = checkRateLimit(`verify_email_${ip}`, 5, 15 * 60 * 1000); // 5 attempts per 15 mins

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const userPayload = await getUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { otp } = await req.json();

    if (!otp) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    const db = await connectDB();
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({
      _id: new ObjectId(userPayload.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const verificationTokensCollection = db.collection("verification_tokens");

    // Find the token
    const tokenRecord = await verificationTokensCollection.findOne({
      email: user.email.toLowerCase(),
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
      await verificationTokensCollection.deleteOne({ _id: tokenRecord._id });
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Update the isVerified field in users collection
    const updateResult = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userPayload.id) },
      { $set: { isVerified: true } },
      { returnDocument: "after" }
    );

    if (!updateResult) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete the used token
    await verificationTokensCollection.deleteOne({ _id: tokenRecord._id });

    const returnUser = {
      id: updateResult._id.toString(),
      email: updateResult.email,
      username: updateResult.username,
      profilePicture: updateResult.profilePicture,
      hasPasskey: !!updateResult.passkey,
      isVerified: updateResult.isVerified,
    };

    return NextResponse.json(
      { message: "Email verified successfully", user: returnUser },
      { status: 200 }
    );
  } catch (error) {
    // console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
