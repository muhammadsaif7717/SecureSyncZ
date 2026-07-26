import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const userPayload = await getUserFromRequest(req);

    if (!userPayload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { otp, currentPassword } = await req.json();

    if (!otp) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password is required" },
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

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    const verificationTokensCollection = db.collection("verification_tokens");

    // Find the token
    const tokenRecord = await verificationTokensCollection.findOne({
      email: user.email.toLowerCase(),
      otp: otp,
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Invalid or incorrect verification code" },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > new Date(tokenRecord.expiresAt)) {
      await verificationTokensCollection.deleteOne({ _id: tokenRecord._id });
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // OTP is valid. Delete all associated data.
    const query = { "user.email": user.email, "user.username": user.username };

    await Promise.all([
      db.collection("passwords").deleteMany(query),
      db.collection("cards").deleteMany(query),
      db.collection("notes").deleteMany(query),
    ]);

    // Delete the used token
    await verificationTokensCollection.deleteMany({
      email: user.email.toLowerCase(),
    });

    // Finally, delete the user account
    await usersCollection.deleteOne({ _id: new ObjectId(userPayload.id) });

    const response = NextResponse.json(
      { message: "Account deleted successfully" },
      { status: 200 }
    );

    // Clear the token cookie
    response.cookies.delete("token");

    return response;
  } catch (error) {
    // console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
