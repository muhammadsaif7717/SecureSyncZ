import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export const PUT = async (
  request: Request,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { message: "User not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const {
      name,
      serviceName,
      cardType,
      cardNumber,
      expiry,
      cvv,
      note,
      website,
      isFavorite,
      tags,
    } = body;

    if (!cardNumber || !expiry || !cvv) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid ID format" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    // Update only if user owns this card entry
    const result = await db.collection("cards").updateOne(
      {
        _id: new ObjectId(id),
        "user.email": user.email,
        "user.username": user.username,
      },
      {
        $set: {
          name,
          serviceName,
          cardType: cardType || "Others",
          cardNumber: encrypt(cardNumber),
          expiry: encrypt(expiry),
          cvv: encrypt(cvv),
          note,
          website,
          isFavorite,
          tags,
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Card entry not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Card updated successfully" });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
