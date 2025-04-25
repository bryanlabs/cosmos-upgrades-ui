import { NextResponse } from "next/server";
import { getUserByWallet } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { wallet: string } }
) {
  const wallet = params.wallet;

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

// Optional: Handle other methods if needed, or return Method Not Allowed
export async function POST() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}

// Add similar handlers for PUT, DELETE, PATCH etc. if you want to explicitly reject them
export async function PUT() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
export async function PATCH() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
