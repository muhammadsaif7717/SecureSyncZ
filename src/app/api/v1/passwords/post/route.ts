import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { normalizePassword } from "@/lib/validations";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    // Authenticate the user
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Required fields check
    if (!body.website || !body.username || !body.password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Normalize data before saving
    const normalizedPassword = normalizePassword({
      ...body,
      user: {
        email: user.email,
        username: user.username,
      },
    });

    const result = await db
      .collection("passwords")
      .insertOne(normalizedPassword);

    return NextResponse.json({
      message: "Password saved successfully",
      id: result.insertedId,
    });
  } catch (error) {
    // console.error("POST /api/passwords/post error:", error);
    return NextResponse.json(
      { error: "Failed to save password" },
      { status: 500 }
    );
  }
};
