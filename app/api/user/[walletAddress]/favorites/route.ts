import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Use /api/me/favorites with an authenticated session." },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Use /api/me/favorites with an authenticated session." },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Use /api/me/favorites with an authenticated session." },
    { status: 410 }
  );
}
