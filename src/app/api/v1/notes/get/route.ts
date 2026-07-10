import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { email, username } = user;

    if (!email || !username) {
      return NextResponse.json(
        { error: "User email or username not found in token" },
        { status: 400 }
      );
    }

    const db = await connectDB();

    const userNotes = await db
      .collection("notes")
      .find({ "user.email": email, "user.username": username })
      .toArray();

    const decryptedNotes = userNotes.map((item) => ({
      ...item,
      content: decrypt(item.content),
    }));

    return NextResponse.json(decryptedNotes, { status: 200 });
  } catch (error) {
    console.error("Error fetching secure notes data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
