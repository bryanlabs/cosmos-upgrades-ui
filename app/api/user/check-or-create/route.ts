import { NextResponse } from "next/server";
import { userExists, createUser } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "Invalid wallet address provided" },
        { status: 400 }
      );
    }

    let exists = await userExists(walletAddress);
    let created = false;

    if (!exists) {
      await createUser(walletAddress);
      created = true;
      exists = true; // User now exists
    }

    return NextResponse.json({ exists, created });
  } catch (error) {
    console.error("API Error checking/creating user:", error);
    // Avoid leaking specific error details to the client
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
