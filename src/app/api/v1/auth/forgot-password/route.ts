import { connectDB } from "@/lib/connectDB";
import { sendMail } from "@/lib/mailer";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const isAllowed = checkRateLimit(`forgot_${ip}`, 3, 15 * 60 * 1000); // 3 attempts per 15 mins

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const db = await connectDB();
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Return 200 even if user not found to prevent email enumeration
      return NextResponse.json(
        { message: "If your email is registered, a reset code has been sent." },
        { status: 200 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database with an expiration of 15 minutes
    const resetTokensCollection = db.collection("reset_tokens");
    await resetTokensCollection.deleteMany({ email: email.toLowerCase() }); // Remove any existing tokens for this email

    await resetTokensCollection.insertOne({
      email: email.toLowerCase(),
      otp,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    // Send email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #059669; text-align: center;">SecureSyncZ Password Reset</h2>
        <p>Hello,</p>
        <p>You have requested to reset your password for your SecureSyncZ account.</p>
        <p>Your password reset code is:</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <strong style="font-size: 24px; letter-spacing: 4px; color: #0f172a;">${otp}</strong>
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request this password reset, please ignore this email or contact support.</p>
        <br />
        <p>Stay secure,</p>
        <p><strong>The SecureSyncZ Team</strong></p>
      </div>
    `;

    await sendMail({
      to: email.toLowerCase(),
      subject: "Your Password Reset Code - SecureSyncZ",
      html: emailHtml,
    });

    return NextResponse.json(
      { message: "If your email is registered, a reset code has been sent." },
      { status: 200 }
    );
  } catch (error) {
    // console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
