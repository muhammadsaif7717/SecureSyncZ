import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { normalizeNote } from "@/lib/validations";
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

    const userDoc = await db
      .collection("users")
      .findOne({ _id: new ObjectId(user.id) });
    if (!userDoc?.isPremium) {
      return NextResponse.json(
        { message: "Premium subscription required" },
        { status: 403 }
      );
    }

    const normalizedData = normalizeNote(body);
    delete (normalizedData as any)._id;
    delete (normalizedData as any).user;
    delete (normalizedData as any).createdAt;
    normalizedData.updatedAt = new Date();

    const result = await db.collection("notes").updateOne(
      {
        _id: new ObjectId(id),
        "user.email": user.email,
        "user.username": user.username,
      },
      {
        $set: normalizedData,
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
    // console.error("PUT error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
