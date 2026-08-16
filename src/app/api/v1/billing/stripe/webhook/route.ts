import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import Stripe from "stripe";
import { ObjectId } from "mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2026-07-29.dahlia",
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature as string,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    // console.error("Webhook Error:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const db = await connectDB();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.client_reference_id) {
          await db.collection("users").updateOne(
            { _id: new ObjectId(session.client_reference_id) },
            {
              $set: {
                isPremium: true,
                subscriptionId: session.subscription,
                hasUsedTrial: true,
              },
            }
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        // Check if subscription is active or trialing
        const isActive =
          subscription.status === "active" ||
          subscription.status === "trialing";

        await db
          .collection("users")
          .updateOne(
            { subscriptionId: subscription.id },
            { $set: { isPremium: isActive } }
          );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await db.collection("users").updateOne(
          { subscriptionId: subscription.id },
          {
            $set: { isPremium: false },
            $unset: { subscriptionId: "" },
          }
        );
        break;
      }

      default:
      // console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    // console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
