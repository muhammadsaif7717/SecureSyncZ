import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export const PUT = async (
  request: Request,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { message: "User not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const { title, content, isFavorite, tags } = body;

    if (!title || !content) {
      return NextResponse.json(
        { message: "Title and content are required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid ID format" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const result = await db.collection("notes").updateOne(
      {
        _id: new ObjectId(id),
        "user.email": user.email,
        "user.username": user.username,
      },
      {
        $set: {
          title,
          content: encrypt(content),
          isFavorite,
          tags,
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Note entry not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Note updated successfully" });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
