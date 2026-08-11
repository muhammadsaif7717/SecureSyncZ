import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Google Cloud Pub/Sub sends the message in the `message.data` field as a Base64 string.
    if (!body.message || !body.message.data) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Decode the Base64 data
    const decodedData = Buffer.from(body.message.data, "base64").toString(
      "utf-8"
    );
    const developerNotification = JSON.parse(decodedData);

    const subscriptionNotification =
      developerNotification.subscriptionNotification;

    if (subscriptionNotification) {
      const notificationType = subscriptionNotification.notificationType;
      const purchaseToken = subscriptionNotification.purchaseToken;

      // notificationType 12 = SUBSCRIPTION_REVOKED (Canceled by Google/User and expired immediately)
      // notificationType 13 = SUBSCRIPTION_EXPIRED (Time ran out and didn't renew)
      if (
        (notificationType === 12 || notificationType === 13) &&
        purchaseToken
      ) {
        const db = await connectDB();

        // Find the user with this purchase token and remove their premium status
        await db.collection("users").updateOne(
          { purchaseToken: purchaseToken },
          {
            $set: {
              isPremium: false,
            },
            $unset: {
              subscriptionId: "",
              purchaseToken: "",
              premiumSince: "",
            },
          }
        );
      }
    }

    // Always return 200 OK so Google knows we received it.
    // If we return 500, Google will keep retrying the webhook for days.
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("RTDN Webhook Error:", error);
    // Even on error, it is often safer to return 200 to acknowledge receipt,
    // but returning 500 allows Pub/Sub to retry if it was a temporary DB failure.
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
