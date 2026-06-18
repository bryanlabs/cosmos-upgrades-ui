import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Use authenticated account session endpoints." },
    { status: 410 }
  );
}
