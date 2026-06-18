import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";
import { NextResponse } from "next/server";
import { encryptWithMasterPassword } from "@/lib/masterEncryption";

export const POST = async (req: Request) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { masterPassword } = await req.json();
    if (!masterPassword) {
      return NextResponse.json(
        { error: "Master password is required" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const userPasswords = await db
      .collection("passwords")
      .find({ "user.email": user.email, "user.username": user.username })
      .toArray();

    const decryptedPasswords = userPasswords.map((item) => ({
      website: item.website,
      username: item.username,
      password: decrypt(item.password),
      note: item.note || "",
      isFavorite: item.isFavorite || false,
      tags: item.tags || [],
    }));

    const encryptedJSON = encryptWithMasterPassword(
      decryptedPasswords,
      masterPassword
    );

    return new NextResponse(encryptedJSON, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="passwords-backup.json"',
      },
    });
  } catch (error) {
    console.error("Error exporting encrypted passwords:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
