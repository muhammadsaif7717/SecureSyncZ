import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { generateAuthenticationOptions } from "@simplewebauthn/server";

const rpID = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token2fa = cookieStore.get("token2fa")?.value;

    if (!token2fa) {
      return NextResponse.json(
        { error: "2FA session expired" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token2fa);
    if (!payload || !payload.is2faPending) {
      return NextResponse.json(
        { error: "Invalid 2FA session" },
        { status: 401 }
      );
    }

    const db = await connectDB();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new ObjectId(payload.id),
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.webAuthnCredentials || user.webAuthnCredentials.length === 0) {
      return NextResponse.json(
        { error: "No security keys registered" },
        { status: 400 }
      );
    }

    const allowCredentials = user.webAuthnCredentials.map((auth: any) => ({
      id: auth.credentialID,
      type: "public-key" as const,
      transports: auth.transports,
    }));

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: "preferred",
    });

    // Save the challenge temporarily
    await usersCollection.updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { currentWebAuthnChallenge: options.challenge } }
    );

    return NextResponse.json(options, { status: 200 });
  } catch (error) {
    // console.error("WebAuthn auth generation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
