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
    const passwordsToInsert = [];

    for (const record of records) {
      const website = record.url || record.name || record.website || "Unknown";
      const username = record.username || "Unknown";
      const password = record.password || "";
      const note = record.note || "";
      const isFavorite = record.isFavorite || false;
      const tags = Array.isArray(record.tags) ? record.tags : [];

      if (password) {
        passwordsToInsert.push({
          website,
          username,
          password: encrypt(password),
          note,
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

    if (passwordsToInsert.length > 0) {
      await db.collection("passwords").insertMany(passwordsToInsert);
    }

    return NextResponse.json({
      message: `Imported ${passwordsToInsert.length} passwords successfully`,
    });
  } catch (error) {
    console.error("Error importing encrypted passwords:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
