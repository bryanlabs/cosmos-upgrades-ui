import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    wallet: user.wallet,
    email: user.email,
    name: user.name,
    image: user.image,
    authProvider: user.authProvider,
    favoriteChains: user.favoriteChains,
  });
}
