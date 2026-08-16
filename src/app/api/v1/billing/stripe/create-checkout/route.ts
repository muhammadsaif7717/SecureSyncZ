import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2026-07-29.dahlia", // Use the latest API version or your stripe's default
});

export async function POST(req: Request) {
  try {
    const userPayload = await getUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = await connectDB();
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userPayload.id) });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has a customer ID
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user._id.toString(),
        },
      });
      customerId = customer.id;

      await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(user._id) },
          { $set: { stripeCustomerId: customerId } }
        );
    }

    // Create a checkout session
    const checkoutOptions: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Ensure you have this in .env
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_URL}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/profile`,
      client_reference_id: user._id.toString(),
    };

    if (!user.hasUsedTrial) {
      checkoutOptions.subscription_data = {
        trial_period_days: 14,
      };
    }

    const session = await stripe.checkout.sessions.create(checkoutOptions);

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error: any) {
    // console.error("Stripe Create Checkout Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
