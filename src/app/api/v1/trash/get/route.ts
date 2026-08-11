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

    const { email } = user;
    const db = await connectDB();

    // 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Auto delete old items
    await db.collection("passwords").deleteMany({
      "user.email": email,
      isDeleted: true,
      deletedAt: { $lt: thirtyDaysAgo },
    });
    await db.collection("cards").deleteMany({
      "user.email": email,
      isDeleted: true,
      deletedAt: { $lt: thirtyDaysAgo },
    });
    await db.collection("notes").deleteMany({
      "user.email": email,
      isDeleted: true,
      deletedAt: { $lt: thirtyDaysAgo },
    });

    // Fetch remaining items
    const passwords = await db
      .collection("passwords")
      .find({ "user.email": email, isDeleted: true })
      .project({ title: 1, deletedAt: 1, website: 1 })
      .toArray();

    const cards = await db
      .collection("cards")
      .find({ "user.email": email, isDeleted: true })
      .project({ cardholderName: 1, deletedAt: 1, bankName: 1 })
      .toArray();

    const notes = await db
      .collection("notes")
      .find({ "user.email": email, isDeleted: true })
      .project({ title: 1, deletedAt: 1 })
      .toArray();

    // Combine and format
    const trashItems = [
      ...passwords.map((p) => ({
        _id: p._id.toString(),
        type: "password",
        title: p.title || p.website || "Untitled Password",
        deletedAt: p.deletedAt,
      })),
      ...cards.map((c) => ({
        _id: c._id.toString(),
        type: "card",
        title: c.bankName || c.cardholderName || "Untitled Card",
        deletedAt: c.deletedAt,
      })),
      ...notes.map((n) => ({
        _id: n._id.toString(),
        type: "note",
        title: n.title || "Untitled Note",
        deletedAt: n.deletedAt,
      })),
    ];

    // Sort by deletedAt descending (newest first)
    trashItems.sort(
      (a, b) =>
        new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
    );

    return NextResponse.json(trashItems, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
