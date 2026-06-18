import { getUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  try {
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

    const returnUser = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      profilePicture: user.profilePicture,
    };

    return NextResponse.json({ user: returnUser }, { status: 200 });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
