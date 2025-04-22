import { NextResponse } from "next/server";
import {
  getUserFavoriteChains,
  addFavoriteChain,
  removeFavoriteChain,
} from "@/lib/prisma";

// GET handler to fetch favorite chains for a user
export async function GET(
  request: Request,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const walletAddress = params.walletAddress;
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const favoriteChains = await getUserFavoriteChains(walletAddress);
    return NextResponse.json(favoriteChains);
  } catch (error) {
    console.error("API Error getting favorite chains:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST handler to add a favorite chain for a user
export async function POST(
  request: Request,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const walletAddress = params.walletAddress;
    const { chainId } = await request.json();

    if (!walletAddress || !chainId) {
      return NextResponse.json(
        { error: "Wallet address and chain ID are required" },
        { status: 400 }
      );
    }

    if (typeof chainId !== "string") {
      return NextResponse.json({ error: "Invalid chain ID" }, { status: 400 });
    }

    const updatedFavorites = await addFavoriteChain(walletAddress, chainId);
    return NextResponse.json(updatedFavorites);
  } catch (error) {
    console.error("API Error adding favorite chain:", error);
    // Handle specific errors like 'User not found' if needed
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a favorite chain for a user
export async function DELETE(
  request: Request,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const walletAddress = params.walletAddress;
    // For DELETE, it's common to pass identifiers in the body or query params
    // We'll assume body here for consistency with POST
    const { chainId } = await request.json();

    if (!walletAddress || !chainId) {
      return NextResponse.json(
        { error: "Wallet address and chain ID are required for removal" },
        { status: 400 }
      );
    }

    if (typeof chainId !== "string") {
      return NextResponse.json({ error: "Invalid chain ID" }, { status: 400 });
    }

    const updatedFavorites = await removeFavoriteChain(walletAddress, chainId);
    return NextResponse.json(updatedFavorites);
  } catch (error) {
    console.error("API Error removing favorite chain:", error);
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
