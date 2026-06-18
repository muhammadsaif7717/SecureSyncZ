import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";
import { NextResponse } from "next/server";
import { stringify } from "csv-stringify/sync";

export const GET = async (req: Request) => {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { email, username } = user;

    const db = await connectDB();

    const userCards = await db
      .collection("cards")
      .find({ "user.email": email, "user.username": username })
      .toArray();

    const decryptedCards = userCards.map((item) => ({
      name: item.name,
      serviceName: item.serviceName,
      cardType: item.cardType || "Others",
      cardNumber: decrypt(item.cardNumber),
      expiry: decrypt(item.expiry),
      cvv: decrypt(item.cvv),
      note: item.note || "",
    }));

    const csv = stringify(decryptedCards, {
      header: true,
      columns: [
        "name",
        "serviceName",
        "cardType",
        "cardNumber",
        "expiry",
        "cvv",
        "note",
      ],
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="cards.csv"',
      },
    });
  } catch (error) {
    console.error("Error exporting cards:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
