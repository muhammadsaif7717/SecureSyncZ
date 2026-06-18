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
    const { passkey } = body;

    if (!passkey || passkey.length !== 6) {
      console.log("Passkey setup error 400: Invalid passkey sent", { passkey });
      return NextResponse.json(
        { error: "A 6-digit passkey is required." },
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

    console.log(
      "Passkey setup: User passkey in DB is",
      user.passkey,
      "typeof",
      typeof user.passkey
    );

    if (user.passkey && user.passkey.trim() !== "") {
      console.log("Passkey setup error 400: Passkey already set", {
        userPasskey: user.passkey,
      });
      return NextResponse.json(
        { error: "Passkey already set." },
        { status: 400 }
      );
    }

    console.log(
      "Passkey setup: Validation passed, proceeding to hash and save."
    );
    const salt = await bcrypt.genSalt(10);
    const hashedPasskey = await bcrypt.hash(passkey, salt);

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userPayload.id) },
      { $set: { passkey: hashedPasskey } },
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
    };

    return NextResponse.json(
      { message: "Passkey set successfully", user: returnUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Passkey setup error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
