import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import speakeasy from "speakeasy";
import qrcode from "qrcode";

export async function POST(req: Request) {
  try {
    const userPayload = await getUserFromRequest(req);

    if (!userPayload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = await connectDB();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new ObjectId(userPayload.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const secret = speakeasy.generateSecret({
      length: 20,
      name: `SecureSyncZ (${user.email})`,
    });

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url!);

    await usersCollection.updateOne(
      { _id: new ObjectId(userPayload.id) },
      { $set: { tempTotpSecret: secret.base32 } }
    );

    return NextResponse.json(
      {
        message: "TOTP setup initiated",
        secret: secret.base32,
        qrCode: qrCodeDataUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    // console.error("TOTP setup error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
