import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Use /api/users/me with an authenticated session." },
    { status: 410 }
  );
}
