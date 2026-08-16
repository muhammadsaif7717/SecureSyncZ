import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { ObjectId } from "mongodb";
import {
  normalizePassword,
  normalizeCard,
  normalizeNote,
} from "@/lib/validations";

export const POST = async (req: Request) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    const db = await connectDB();

    const processItem = async (collectionName: string, item: any) => {
      let normalizedItem = item;

      if (collectionName === "passwords") {
        normalizedItem = normalizePassword(item);
      } else if (collectionName === "cards") {
        normalizedItem = normalizeCard(item);
      } else if (collectionName === "notes") {
        normalizedItem = normalizeNote(item);
      }

      // Ensure the item belongs to the authenticated user
      normalizedItem.user = { email: user.email, username: user.username };

      const { _id, ...updateData } = normalizedItem;

      if (_id) {
        // Overwrite existing data if _id is provided
        let objectId;
        try {
          objectId = new ObjectId(_id);
        } catch (e) {
          objectId = _id; // In case it's not a standard ObjectId
        }

        const existingItem = await db
          .collection(collectionName)
          .findOne({ _id: objectId, "user.email": user.email });

        if (existingItem) {
          const dbUpdatedAt = existingItem.updatedAt
            ? new Date(existingItem.updatedAt).getTime()
            : 0;
          const importUpdatedAt = updateData.updatedAt
            ? new Date(updateData.updatedAt).getTime()
            : 0;

          // Only update if import data is newer or if we cannot determine (fallback to overwrite)
          if (importUpdatedAt >= dbUpdatedAt || !existingItem.updatedAt) {
            await db
              .collection(collectionName)
              .updateOne(
                { _id: objectId, "user.email": user.email },
                { $set: updateData }
              );
          }
        } else {
          await db
            .collection(collectionName)
            .insertOne({ _id: objectId, ...updateData });
        }
      } else {
        // Insert as new data
        await db.collection(collectionName).insertOne(normalizedItem);
      }
    };

    if (contentType.includes("application/json")) {
      const data = await req.json();

      if (data.passwords && Array.isArray(data.passwords)) {
        for (const p of data.passwords) await processItem("passwords", p);
      }
      if (data.cards && Array.isArray(data.cards)) {
        for (const c of data.cards) await processItem("cards", c);
      }
      if (data.notes && Array.isArray(data.notes)) {
        for (const n of data.notes) await processItem("notes", n);
      }
    } else {
      // Legacy fallback for FormData
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "File is required" },
          { status: 400 }
        );
      }

      const fileContent = await file.text();
      const isCSV = file.name.toLowerCase().endsWith(".csv");

      if (isCSV) {
        // Parse CSV as passwords
        const records = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
        });

        for (const record of records as any[]) {
          const passwordItem = {
            website: record.url || record.name || "Unknown",
            username: record.username || "",
            password: record.password || "",
            note: record.note || "",
            isFavorite: false,
            tags: [],
          };
          await processItem("passwords", passwordItem);
        }
      } else {
        // Parse JSON
        let data;
        try {
          data = JSON.parse(fileContent);
        } catch (e) {
          return NextResponse.json(
            { error: "Invalid JSON file" },
            { status: 400 }
          );
        }

        if (data.passwords && Array.isArray(data.passwords)) {
          for (const p of data.passwords) await processItem("passwords", p);
        }
        if (data.cards && Array.isArray(data.cards)) {
          for (const c of data.cards) await processItem("cards", c);
        }
        if (data.notes && Array.isArray(data.notes)) {
          for (const n of data.notes) await processItem("notes", n);
        }
      }
    }

    return NextResponse.json({ message: "Import successful" }, { status: 200 });
  } catch (error: any) {
    // console.error("Error importing data:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};
