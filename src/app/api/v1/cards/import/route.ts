import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";

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
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const csvContent = await file.text();
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });

    if (records.length === 0) {
      return NextResponse.json({ error: "Empty CSV file" }, { status: 400 });
    }

    const db = await connectDB();
    const cardsToInsert = [];

    for (const record of records as any[]) {
      const name = record.name || "Unknown Card";
      const serviceName = record.serviceName || "Unknown Service";
      const cardType = record.cardType || "Others";
      const cardNumber = record.cardNumber || "";
      const expiry = record.expiry || "";
      const cvv = record.cvv || "";
      const note = record.note || "";

      if (cardNumber && expiry && cvv) {
        cardsToInsert.push({
          name,
          serviceName,
          cardType,
          cardNumber: encrypt(cardNumber),
          expiry: encrypt(expiry),
          cvv: encrypt(cvv),
          note,
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
    console.error("Error importing cards:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
