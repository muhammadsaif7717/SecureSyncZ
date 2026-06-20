import * as jose from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not defined!");
}

export async function signToken(payload: {
  id: string;
  email: string;
  username: string;
}) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as { id: string; email: string; username: string };
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

export async function getUserFromRequest(req: Request) {
  try {
    // Try to get from Cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (token) {
      return await verifyToken(token);
    }
  } catch (error) {
    console.error("Error reading token from cookies:", error);
  }

  try {
    // Try to get from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      return await verifyToken(token);
    }
  } catch (error) {
    console.error("Error reading token from headers:", error);
  }

  return null;
}
