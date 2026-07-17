import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
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

    const db = await connectDB();
    const query = { "user.email": user.email, "user.username": user.username };

    const [passwords, cards, notes] = await Promise.all([
      db.collection("passwords").find(query).toArray(),
      db.collection("cards").find(query).toArray(),
      db.collection("notes").find(query).toArray(),
    ]);

    // We do not decrypt or modify the data, just export it as it is in the database.
    // The data might be zero-knowledge encrypted on the client side, so we just return it.
    // We keep the _id so it can be overwritten on import.
    const exportData = {
      passwords,
      cards,
      notes,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="securesyncz-backup.json"',
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
