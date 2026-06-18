import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
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

    if (
      !body.name ||
      !body.serviceName ||
      !body.cardNumber ||
      !body.expiry ||
      !body.cvv
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const result = await db.collection("cards").insertOne({
      name: body.name,
      serviceName: body.serviceName,
      cardType: body.cardType || "Others",
      cardNumber: encrypt(body.cardNumber),
      expiry: encrypt(body.expiry),
      cvv: encrypt(body.cvv),
      note: body.note || "",
      createdAt: new Date().toISOString(),
      // Securely associate with the authenticated user
      user: {
        email: user.email,
        username: user.username,
      },
    });

    return NextResponse.json({
      message: "Card saved successfully",
      id: result.insertedId,
    });
  } catch (error) {
    console.error("POST /api/cards/post error:", error);
    return NextResponse.json({ error: "Failed to save card" }, { status: 500 });
  }
};
