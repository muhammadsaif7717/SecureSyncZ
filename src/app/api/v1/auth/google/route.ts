import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { signToken } from "@/lib/auth";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  try {
    const { credential } = await req.json();

    if (!credential) {
      return NextResponse.json(
        { error: "Google credential token is missing" },
        { status: 400 }
      );
    }

    // Verify Google ID Token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.name) {
      return NextResponse.json(
        { error: "Invalid Google token payload" },
        { status: 400 }
      );
    }

    const { email, name, picture } = payload;
    const db = await connectDB();
    const usersCollection = db.collection("users");

    // Check if user exists
    let user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create a new user for Google login
      const newUser = {
        username: name,
        email: email.toLowerCase(),
        password: "", // No password for Google users
        isVerified: true, // Google emails are already verified
        createdAt: new Date(),
        passkey: null,
        encryptedValidationStr: null,
        profilePicture: picture || null,
        isPremium: false,
      };

      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else if (!user.profilePicture && picture) {
      // If user exists but doesn't have a profile picture, sync it from Google
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { profilePicture: picture } }
      );
      user.profilePicture = picture;
    }

    const requires2FA =
      user.twoFactorEnabled ||
      (user.webAuthnCredentials && user.webAuthnCredentials.length > 0);

    if (requires2FA) {
      const token2fa = await signToken({
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        is2faPending: true,
      });

      const response = NextResponse.json(
        {
          require2FA: true,
          methods: [
            ...(user.twoFactorEnabled ? ["totp"] : []),
            ...(user.webAuthnCredentials?.length ? ["webauthn"] : []),
          ],
        },
        { status: 200 }
      );

      response.cookies.set({
        name: "token2fa",
        value: token2fa,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60, // 15 mins
        path: "/",
      });

      return response;
    }

    // Generate JWT Token
    const token = await signToken({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    const response = NextResponse.json(
      {
        message: "Successfully logged in with Google",
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          profilePicture: user.profilePicture,
          hasPasskey:
            !!user.encryptedValidationStr ||
            !!user.hasPasskey ||
            !!user.passkey,
          isVerified: user.isVerified || false,
          hasPassword: !!user.password,
          encryptedValidationStr: user.encryptedValidationStr || null,
          twoFactorEnabled: user.twoFactorEnabled || false,
        },
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    // console.error("Google login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
