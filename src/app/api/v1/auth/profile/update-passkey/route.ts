import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest, signToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const userPayload = await getUserFromRequest(req);

    if (!userPayload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { passkey, encryptedValidationStr, passwords, cards, notes } = body;

    if (!passkey || !encryptedValidationStr) {
      return NextResponse.json(
        { error: "Passkey and encrypted validation string are required" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const usersCollection = db.collection("users");
    const userId = new ObjectId(userPayload.id);

    const user = await usersCollection.findOne({ _id: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPasskey = await bcrypt.hash(passkey, salt);

    // Use MongoDB transaction if replica set is available, else do sequential updates
    // For standalone MongoDB instances (like Mongoose default dev), we'll do sequential operations.

    // Update user passkey and encryptedValidationStr
    await usersCollection.updateOne(
      { _id: userId },
      {
        $set: {
          passkey: hashedPasskey,
          encryptedValidationStr: encryptedValidationStr,
        },
      }
    );

    // Update passwords
    if (passwords && Array.isArray(passwords) && passwords.length > 0) {
      const passwordBulkOps = passwords.map((p: any) => ({
        updateOne: {
          filter: { _id: new ObjectId(p._id), "user.email": user.email },
          update: {
            $set: {
              encryptedData: p.encryptedData,
              updatedAt: new Date(),
            },
          },
        },
      }));
      if (passwordBulkOps.length > 0) {
        await db.collection("passwords").bulkWrite(passwordBulkOps);
      }
    }

    // Update cards
    if (cards && Array.isArray(cards) && cards.length > 0) {
      const cardBulkOps = cards.map((c: any) => ({
        updateOne: {
          filter: { _id: new ObjectId(c._id), "user.email": user.email },
          update: {
            $set: {
              encryptedData: c.encryptedData,
              updatedAt: new Date(),
            },
          },
        },
      }));
      if (cardBulkOps.length > 0) {
        await db.collection("cards").bulkWrite(cardBulkOps);
      }
    }

    // Update notes
    if (notes && Array.isArray(notes) && notes.length > 0) {
      const noteBulkOps = notes.map((n: any) => ({
        updateOne: {
          filter: { _id: new ObjectId(n._id), "user.email": user.email },
          update: {
            $set: {
              encryptedData: n.encryptedData,
              updatedAt: new Date(),
            },
          },
        },
      }));
      if (noteBulkOps.length > 0) {
        await db.collection("notes").bulkWrite(noteBulkOps);
      }
    }

    // Return updated user payload
    const returnUser = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      profilePicture: user.profilePicture,
      hasPasskey: true,
      hasPassword: !!user.password,
      isVerified: user.isVerified || false,
    };

    const token = await signToken({
      id: returnUser.id,
      email: returnUser.email,
      username: returnUser.username,
    });

    const response = NextResponse.json(
      {
        message: "Passkey updated and data re-encrypted successfully",
        user: returnUser,
      },
      { status: 200 }
    );

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    // console.error("Update passkey error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while re-encrypting data" },
      { status: 500 }
    );
  }
}
