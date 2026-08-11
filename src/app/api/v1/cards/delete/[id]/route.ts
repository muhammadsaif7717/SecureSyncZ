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

    const { searchParams } = new URL(request.url);
    const isPermanent = searchParams.get("permanent") === "true";

    let isNotFound = false;
    if (isPermanent) {
      const deleteResult = await db.collection("cards").deleteOne({
        _id: new ObjectId(id),
        "user.email": user.email,
      });
      isNotFound = deleteResult.deletedCount === 0;
    } else {
      const updateResult = await db.collection("cards").updateOne(
        {
          _id: new ObjectId(id),
          "user.email": user.email,
        },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        }
      );
      isNotFound = updateResult.matchedCount === 0;
    }

    if (isNotFound) {
      return NextResponse.json(
        { error: "Card not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: isPermanent
          ? "Card permanently deleted"
          : "Card moved to trash",
      },
      { status: 200 }
    );
  } catch (error) {
    // console.error("DELETE Error:", error);
    return NextResponse.json(
      { error: "Failed to delete card" },
      { status: 500 }
    );
  }
};
