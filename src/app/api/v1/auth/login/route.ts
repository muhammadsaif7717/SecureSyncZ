import { connectDB } from "@/lib/connectDB";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const isAllowed = checkRateLimit(`login_${ip}`, 5, 15 * 60 * 1000); // 5 attempts per 15 mins

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const usersCollection = db.collection("users");

    // Find user by email
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const userId = user._id.toString();

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

      // Set temporary 2FA token
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

    // Sign final JWT
    const token = await signToken({
      id: userId,
      email: user.email,
      username: user.username,
    });

    // Set JWT in HttpOnly cookie
    const response = NextResponse.json(
      {
        message: "User logged in successfully",
        user: {
          id: userId,
          email: user.email,
          username: user.username,
          profilePicture: user.profilePicture,
          hasPasskey:
            !!user.encryptedValidationStr ||
            !!user.hasPasskey ||
            !!user.passkey,
          isVerified: user.isVerified || false,
          hasPassword: !!user.password,
          encryptedValidationStr: user.encryptedValidationStr,
          twoFactorEnabled: user.twoFactorEnabled || false,
        },
      },
      { status: 200 }
    );

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
    // console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
