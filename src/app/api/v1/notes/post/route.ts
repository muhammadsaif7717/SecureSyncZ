import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { normalizeNote } from "@/lib/validations";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
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

    const body = await req.json();
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const newNote = normalizeNote({
      ...body,
      user: { email, username },
    });

    const result = await db.collection("notes").insertOne(newNote);

    return NextResponse.json(
      { message: "Note created successfully", id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    // console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
