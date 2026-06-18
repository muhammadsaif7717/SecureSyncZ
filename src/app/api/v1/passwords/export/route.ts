import { connectDB } from "@/lib/connectDB";
import { getUserFromRequest } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";
import { NextResponse } from "next/server";
import { stringify } from "csv-stringify/sync";

export const GET = async (req: Request) => {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { email, username } = user;

    const db = await connectDB();

    const userPasswords = await db
      .collection("passwords")
      .find({ "user.email": email, "user.username": username })
      .toArray();

    const decryptedPasswords = userPasswords.map((item) => ({
      name: item.website,
      url: item.website,
      username: item.username,
      password: decrypt(item.password),
      note: item.note || "",
    }));

    const csv = stringify(decryptedPasswords, {
      header: true,
      columns: ["name", "url", "username", "password", "note"],
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="passwords.csv"',
      },
    });
  } catch (error) {
    console.error("Error exporting passwords:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
