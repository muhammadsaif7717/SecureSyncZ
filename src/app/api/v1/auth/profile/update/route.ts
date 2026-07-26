import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest, signToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { sendMail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const userPayload = await getUserFromRequest(req);

    if (!userPayload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const {
      username,
      email,
      password,
      profilePicture,
      passkey,
      currentPassword,
      otp,
    } = body;

    const isOnlyProfilePicture =
      profilePicture !== undefined &&
      !username &&
      !email &&
      !password &&
      !passkey;

    if (!currentPassword && !isOnlyProfilePicture) {
      return NextResponse.json(
        { error: "Current password is required to save changes." },
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

    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Incorrect current password." },
          { status: 401 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    if (username) updateData.username = username;
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const oldEmail = user.email.toLowerCase();
      updateData.email = email.toLowerCase();
      updateData.isVerified = false; // The automatic system will prompt for verification

      const alertHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #ef4444; text-align: center;">Security Alert - SecureSyncZ</h2>
          <p>Hello,</p>
          <p>We noticed a request to change the email address associated with your SecureSyncZ account to <strong>${updateData.email}</strong>.</p>
          <p>If you authorized this change, you don't need to do anything. If you did not make this request, please log in immediately and secure your account.</p>
          <br />
          <p>Stay secure,</p>
          <p><strong>The SecureSyncZ Team</strong></p>
        </div>
      `;

      await sendMail({
        to: oldEmail,
        subject: "Security Alert: Email Change Requested - SecureSyncZ",
        html: alertHtml,
      });
    }
    if (profilePicture !== undefined)
      updateData.profilePicture = profilePicture;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    if (passkey) {
      const salt = await bcrypt.genSalt(10);
      updateData.passkey = await bcrypt.hash(passkey, salt);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Update user in DB
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userPayload.id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const returnUser = {
      id: result._id.toString(),
      email: result.email,
      username: result.username,
      profilePicture: result.profilePicture,
      hasPasskey: !!result.passkey,
      isVerified: result.isVerified || false,
    };

    const token = await signToken({
      id: returnUser.id,
      email: returnUser.email,
      username: returnUser.username,
    });

    const response = NextResponse.json(
      { message: "Profile updated successfully", user: returnUser },
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
    // console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
