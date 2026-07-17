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
    const query = { "user.email": user.email, "user.username": user.username };

    // Delete all data associated with the user across collections
    await Promise.all([
      db.collection("passwords").deleteMany(query),
      db.collection("cards").deleteMany(query),
      db.collection("notes").deleteMany(query),
    ]);

    return NextResponse.json(
      { message: "All data deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting all data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
