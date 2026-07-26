import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const isAllowed = checkRateLimit(`send_verify_${ip}`, 3, 15 * 60 * 1000); // 3 attempts per 15 mins

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

    const db = await connectDB();
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userPayload.id) });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      // No body or invalid json
    }

    const { newEmail } = body;

    if (newEmail && newEmail.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await db.collection("users").findOne({
        email: newEmail.toLowerCase(),
        _id: { $ne: new ObjectId(userPayload.id) },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            error:
              "This email is already in use by another account. Please try a different email.",
          },
          { status: 400 }
        );
      }
    }

    const targetEmail = newEmail ? newEmail.toLowerCase() : user.email;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const verificationTokensCollection = db.collection("verification_tokens");
    await verificationTokensCollection.deleteMany({
      email: targetEmail,
    }); // Remove any existing tokens for this email

    await verificationTokensCollection.insertOne({
      email: targetEmail,
      otp,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    // Send email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #059669; text-align: center;">SecureSyncZ Email Verification</h2>
        <p>Hello,</p>
        <p>Please use the verification code below to verify your email address on SecureSyncZ.</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <strong style="font-size: 24px; letter-spacing: 4px; color: #0f172a;">${otp}</strong>
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <br />
        <p>Stay secure,</p>
        <p><strong>The SecureSyncZ Team</strong></p>
      </div>
    `;

    await sendMail({
      to: targetEmail,
      subject: "Verify your email address - SecureSyncZ",
      html: emailHtml,
    });

    // If changing email, send a security alert to the old email
    if (newEmail && newEmail.toLowerCase() !== user.email.toLowerCase()) {
      const alertHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #ef4444; text-align: center;">Security Alert - SecureSyncZ</h2>
          <p>Hello,</p>
          <p>We noticed a request to change the email address associated with your SecureSyncZ account to <strong>${newEmail}</strong>.</p>
          <p>If you authorized this change, you don't need to do anything. If you did not make this request, please log in immediately and secure your account.</p>
          <br />
          <p>Stay secure,</p>
          <p><strong>The SecureSyncZ Team</strong></p>
        </div>
      `;
      await sendMail({
        to: user.email.toLowerCase(),
        subject: "Security Alert: Email Change Requested - SecureSyncZ",
        html: alertHtml,
      });
    }

    return NextResponse.json(
      { message: "Verification code sent." },
      { status: 200 }
    );
  } catch (error) {
    // console.error("Send verification error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
