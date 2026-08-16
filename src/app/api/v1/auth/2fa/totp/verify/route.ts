import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import speakeasy from "speakeasy";

export async function POST(req: Request) {
  try {
    const userPayload = await getUserFromRequest(req);

    if (!userPayload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json(
        { error: "A valid 6-digit code is required" },
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

    if (!user.tempTotpSecret) {
      return NextResponse.json(
        { error: "TOTP setup was not initiated. Please restart setup." },
        { status: 400 }
      );
    }

    // Verify the code
    const isValid = speakeasy.totp.verify({
      secret: user.tempTotpSecret,
      encoding: "base32",
      token: code,
      window: 1, // Allow 1 step before/after
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid authenticator code" },
        { status: 400 }
      );
    }

    // Move the secret from temp to permanent and enable 2FA
    await usersCollection.updateOne(
      { _id: new ObjectId(userPayload.id) },
      {
        $set: { twoFactorEnabled: true, totpSecret: user.tempTotpSecret },
        $unset: { tempTotpSecret: "" },
      }
    );

    return NextResponse.json(
      { message: "Two-Factor Authentication successfully enabled" },
      { status: 200 }
    );
  } catch (error) {
    // console.error("TOTP verify error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
