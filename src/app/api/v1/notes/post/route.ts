import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
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

    const { title, content, tags, isFavorite } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const newNote = {
      user: { email, username },
      title,
      content: encrypt(content),
      tags: tags || [],
      isFavorite: isFavorite || false,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("notes").insertOne(newNote);

    return NextResponse.json(
      { message: "Note created successfully", id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
