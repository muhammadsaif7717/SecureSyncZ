import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export const DELETE = async (
  request: Request,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const db = await connectDB();
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Delete only if user owns the card entry
    const result = await db.collection("cards").deleteOne({
      _id: new ObjectId(id),
      "user.email": user.email,
      "user.username": user.username,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Card not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Card deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { error: "Failed to delete card" },
      { status: 500 }
    );
  }
};
