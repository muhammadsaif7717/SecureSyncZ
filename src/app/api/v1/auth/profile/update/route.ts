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

    const body = await req.json();
    const { username, email, password, profilePicture } = body;

    const db = await connectDB();
    const usersCollection = db.collection("users");

    const updateData: Record<string, unknown> = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email.toLowerCase();
    if (profilePicture !== undefined)
      updateData.profilePicture = profilePicture;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
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
    };

    return NextResponse.json(
      { message: "Profile updated successfully", user: returnUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
