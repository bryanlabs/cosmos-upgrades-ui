import { NextRequest, NextResponse } from "next/server";
import { getUserByWallet } from "@/lib/prisma";

// Helper to extract the wallet address from the URL
function extractWalletAddress(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const wallet = segments[segments.indexOf("user") + 1];
  return wallet || null;
}

export async function GET(request: NextRequest) {
  const wallet = extractWalletAddress(request);

  if (!wallet || typeof wallet !== "string") {
    return NextResponse.json(
      { message: "Wallet address parameter is required and must be a string." },
      { status: 400 }
    );
  }

  try {
    const user = await getUserByWallet(wallet);

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error(`API Error fetching user by wallet ${wallet}:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { message: `Internal Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Optional: Handle unsupported HTTP methods
export async function POST() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function PUT() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function PATCH() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
