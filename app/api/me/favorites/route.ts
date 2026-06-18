import { NextRequest, NextResponse } from "next/server";
import {
  addFavoriteChain,
  getUserFavoriteChains,
  removeFavoriteChain,
} from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

const MAX_CHAIN_ID_LENGTH = 80;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favoriteChains = await getUserFavoriteChains(user.wallet);
  return NextResponse.json(favoriteChains);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chainId } = await request.json();
  if (!isValidChainId(chainId)) {
    return NextResponse.json({ error: "Invalid chain ID" }, { status: 400 });
  }

  const updatedFavorites = await addFavoriteChain(user.wallet, chainId);
  return NextResponse.json(updatedFavorites);
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chainId } = await request.json();
  if (!isValidChainId(chainId)) {
    return NextResponse.json({ error: "Invalid chain ID" }, { status: 400 });
  }

  const updatedFavorites = await removeFavoriteChain(user.wallet, chainId);
  return NextResponse.json(updatedFavorites);
}

function isValidChainId(chainId: unknown): chainId is string {
  return (
    typeof chainId === "string" &&
    chainId.length > 0 &&
    chainId.length <= MAX_CHAIN_ID_LENGTH &&
    /^[a-zA-Z0-9._-]+$/.test(chainId)
  );
}
