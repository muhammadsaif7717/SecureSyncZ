import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export const DELETE = async (req: Request) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    let password = "";
    try {
      const body = await req.json();
      password = body?.password || "";
    } catch (_) {}

    const db = await connectDB();
    const usersCollection = db.collection("users");

    const dbUser = await usersCollection.findOne({
      _id: new ObjectId(user.id),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hasPassword = !!dbUser.password && dbUser.password !== "";

    if (hasPassword) {
      if (!password) {
        return NextResponse.json(
          { error: "Password is required to delete all data." },
          { status: 400 }
        );
      }
      const isMatch = await bcrypt.compare(password, dbUser.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Incorrect password." },
          { status: 401 }
        );
      }
    }

    const query = { "user.email": user.email };

    // Delete all data associated with the user across collections
    await Promise.all([
      db.collection("passwords").deleteMany(query),
      db.collection("cards").deleteMany(query),
      db.collection("notes").deleteMany(query),
    ]);

    return NextResponse.json(
      { message: "All data deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
