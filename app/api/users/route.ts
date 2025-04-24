import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await getAllUsers();
    // Optionally, you might want to remove sensitive data before sending
    // const safeUsers = users.map(user => ({ id: user.id, wallet: user.wallet }));
    return NextResponse.json(users);
  } catch (error) {
    console.error("API Error getting all users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
