import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  normalizePassword,
  normalizeCard,
  normalizeNote,
} from "@/lib/validations";

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

    // We normalize the exported data to ensure it follows strict validation rules.
    const exportData = {
      passwords: passwords.map((p) => normalizePassword(p)),
      cards: cards.map((c) => normalizeCard(c)),
      notes: notes.map((n) => normalizeNote(n)),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="securesyncz-backup.json"',
      },
    });
  } catch (error) {
    // console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
