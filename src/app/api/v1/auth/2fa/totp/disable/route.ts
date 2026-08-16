import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const userPayload = await getUserFromRequest(req);

    if (!userPayload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = await connectDB();
    const usersCollection = db.collection("users");

    await usersCollection.updateOne(
      { _id: new ObjectId(userPayload.id) },
      {
        $set: { twoFactorEnabled: false },
        $unset: { totpSecret: "" },
      }
    );

    return NextResponse.json(
      { message: "Authenticator App disabled successfully" },
      { status: 200 }
    );
  } catch (error) {
    // console.error("Disable TOTP error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
