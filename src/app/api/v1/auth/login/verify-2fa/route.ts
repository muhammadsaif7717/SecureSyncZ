import { connectDB } from "@/lib/connectDB";
import { signToken, verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import speakeasy from "speakeasy";

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

    const body = await req.json();
    const { type, code } = body;

    const db = await connectDB();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new ObjectId(payload.id),
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let isValid = false;

    if (type === "totp") {
      if (!user.totpSecret || !user.twoFactorEnabled) {
        return NextResponse.json(
          { error: "TOTP is not enabled" },
          { status: 400 }
        );
      }
      isValid = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: "base32",
        token: code,
        window: 1,
      });
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid authenticator code" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json({ error: "Invalid 2FA type" }, { status: 400 });
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 }
      );
    }

    // Sign final JWT
    const token = await signToken({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    const response = NextResponse.json(
      {
        message: "User logged in successfully",
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          profilePicture: user.profilePicture,
          hasPasskey: !!user.passkey,
          isVerified: user.isVerified || false,
          hasPassword: !!user.password,
          encryptedValidationStr: user.encryptedValidationStr,
          twoFactorEnabled: user.twoFactorEnabled || false,
        },
      },
      { status: 200 }
    );

    // Set JWT and clear 2FA token
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    response.cookies.delete("token2fa");

    return response;
  } catch (error) {
    console.error("2FA verify error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
