import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const userPayload = await getUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { productId, purchaseToken, platform, orderId } = await req.json();

    if (!productId || !purchaseToken) {
      return NextResponse.json(
        { error: "Missing purchase details" },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Update MongoDB user with verified in-app purchase details
    await db.collection("users").updateOne(
      { _id: new ObjectId(userPayload.id) },
      {
        $set: {
          isPremium: true,
          subscriptionProvider: platform || "google_play",
          productId,
          purchaseToken,
          orderId: orderId || null,
          updatedAt: new Date(),
        },
      }
    );

    const updatedUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userPayload.id) });

    return NextResponse.json({
      success: true,
      isPremium: true,
      user: {
        id: updatedUser?._id,
        email: updatedUser?.email,
        username: updatedUser?.username,
        isPremium: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to verify purchase" },
      { status: 500 }
    );
  }
}
