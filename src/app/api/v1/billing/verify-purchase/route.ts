import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/connectDB";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const userPayload = await getUserFromRequest(req);

    if (!userPayload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { token, sku } = await req.json();

    if (!token || !sku) {
      return NextResponse.json(
        { error: "Token and SKU are required" },
        { status: 400 }
      );
    }

    // TODO: Verify the token with Google Play Developer API here.
    // This typically involves using the 'googleapis' package and a Service Account.
    // Example:
    // const auth = new google.auth.GoogleAuth({ ...credentials });
    // const androidpublisher = google.androidpublisher({ version: 'v3', auth });
    // const res = await androidpublisher.purchases.subscriptions.get({
    //   packageName: 'com.yourdomain.app',
    //   subscriptionId: sku,
    //   token: token,
    // });

    // For now, we assume token is valid since it comes from the Play Store TWA response.
    // In production, YOU MUST verify it server-side to prevent fraud.
    const isValidPurchase = true;

    if (isValidPurchase) {
      const db = await connectDB();

      await db.collection("users").updateOne(
        { _id: new ObjectId(userPayload.id) },
        {
          $set: {
            isPremium: true,
            premiumSince: new Date(),
            subscriptionId: sku,
            purchaseToken: token,
          },
        }
      );

      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "Invalid purchase token" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Verify purchase error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
