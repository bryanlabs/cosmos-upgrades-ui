import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Issues a single-use nonce for wallet login and stashes it in an httpOnly
// cookie. The client signs a message containing this nonce; the wallet
// Credentials provider checks the signed nonce against the cookie, preventing
// replay of a captured signature.
export async function GET() {
  const nonce = randomBytes(16).toString("hex");
  const res = NextResponse.json({ nonce });
  res.cookies.set("wallet_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300, // 5 minutes
  });
  return res;
}
