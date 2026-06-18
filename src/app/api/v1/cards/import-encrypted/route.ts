import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { NextResponse } from "next/server";
import { decryptWithMasterPassword } from "@/lib/masterEncryption";

export const POST = async (req: Request) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const masterPassword = formData.get("masterPassword") as string;

    if (!file || !masterPassword) {
      return NextResponse.json(
        { error: "File and master password are required" },
        { status: 400 }
      );
    }

    const encryptedContent = await file.text();
    let records: any[];

    try {
      records = decryptWithMasterPassword(encryptedContent, masterPassword);
      if (!Array.isArray(records)) {
        throw new Error("Invalid format");
      }
    } catch (e) {
      return NextResponse.json(
        { error: "Incorrect master password or corrupted file" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const cardsToInsert = [];

    for (const record of records) {
      const name = record.name || "Unknown";
      const serviceName = record.serviceName || name;
      const cardType = record.cardType || "Others";
      const cardNumber = record.cardNumber || "";
      const expiry = record.expiry || "";
      const cvv = record.cvv || "";
      const note = record.note || "";
      const website = record.website || "";
      const isFavorite = record.isFavorite || false;
      const tags = Array.isArray(record.tags) ? record.tags : [];

      if (cardNumber && expiry && cvv) {
        cardsToInsert.push({
          name,
          serviceName,
          cardType,
          cardNumber: encrypt(cardNumber),
          expiry: encrypt(expiry),
          cvv: encrypt(cvv),
          note,
          website,
          isFavorite,
          tags,
          createdAt: new Date().toISOString(),
          user: {
            email: user.email,
            username: user.username,
          },
        });
      }
    }

    if (cardsToInsert.length > 0) {
      await db.collection("cards").insertMany(cardsToInsert);
    }

    return NextResponse.json({
      message: `Imported ${cardsToInsert.length} cards successfully`,
    });
  } catch (error) {
    console.error("Error importing encrypted cards:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
