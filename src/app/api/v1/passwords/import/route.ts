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
    const passwordsToInsert = [];

    for (const record of records as any[]) {
      const website = record.url || record.name || record.website || "Unknown";
      const username = record.username || "Unknown";
      const password = record.password || "";
      const note = record.note || "";

      if (password) {
        passwordsToInsert.push({
          website,
          username,
          password: encrypt(password),
          note,
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
    console.error("Error importing passwords:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
