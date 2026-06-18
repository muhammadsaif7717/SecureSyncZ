import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";
import { NextResponse } from "next/server";
import { encryptWithMasterPassword } from "@/lib/masterEncryption";

export const POST = async (req: Request) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { masterPassword } = await req.json();
    if (!masterPassword) {
      return NextResponse.json(
        { error: "Master password is required" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const userCards = await db
      .collection("cards")
      .find({ "user.email": user.email, "user.username": user.username })
      .toArray();

    const decryptedCards = userCards.map((item) => ({
      name: item.name,
      serviceName: item.serviceName,
      cardType: item.cardType || "Others",
      cardNumber: decrypt(item.cardNumber),
      expiry: decrypt(item.expiry),
      cvv: decrypt(item.cvv),
      note: item.note || "",
      website: item.website || "",
      isFavorite: item.isFavorite || false,
      tags: item.tags || [],
    }));

    const encryptedJSON = encryptWithMasterPassword(
      decryptedCards,
      masterPassword
    );

    return new NextResponse(encryptedJSON, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="cards-backup.json"',
      },
    });
  } catch (error) {
    console.error("Error exporting encrypted cards:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
