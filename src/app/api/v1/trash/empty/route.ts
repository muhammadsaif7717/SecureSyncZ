import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export const DELETE = async (req: Request) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const db = await connectDB();

    await db.collection("passwords").deleteMany({
      "user.email": user.email,
      isDeleted: true,
    });

    await db.collection("cards").deleteMany({
      "user.email": user.email,
      isDeleted: true,
    });

    await db.collection("notes").deleteMany({
      "user.email": user.email,
      isDeleted: true,
    });

    return NextResponse.json(
      { message: "Trash emptied successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to empty trash" },
      { status: 500 }
    );
  }
};
