import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";
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

    const { id, type } = await req.json();

    if (!id || !type) {
      return NextResponse.json(
        { error: "Missing id or type" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const db = await connectDB();

    const collectionName =
      type === "password"
        ? "passwords"
        : type === "card"
          ? "cards"
          : type === "note"
            ? "notes"
            : null;

    if (!collectionName) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const result = await db.collection(collectionName).updateOne(
      {
        _id: new ObjectId(id),
        "user.email": user.email,
        isDeleted: true,
      },
      {
        $unset: {
          isDeleted: "",
          deletedAt: "",
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Item not found in trash" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Item restored successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to restore item" },
      { status: 500 }
    );
  }
};
