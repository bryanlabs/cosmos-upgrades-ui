import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client"; // Import PrismaClient for disconnect
import { addChainLink, getChainLinksByChainId } from "@/lib/prisma";

const prisma = new PrismaClient(); // Instantiate client for disconnect functionality

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Destructure and validate required fields including label
    const { userId, chainId, label, url } = body;

    if (!userId || !chainId || !label || !url) {
      return NextResponse.json(
        { error: "Missing required fields: userId, chainId, label, url" },
        { status: 400 }
      );
    }

    // Basic type checks (can be more robust)
    if (typeof userId !== "number") {
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400 }
      );
    }
    if (typeof chainId !== "string") {
      return NextResponse.json(
        { error: "Invalid chainId format" },
        { status: 400 }
      );
    }
    if (typeof label !== "string") {
      return NextResponse.json(
        { error: "Invalid label format" },
        { status: 400 }
      );
    }
    if (typeof url !== "string") {
      return NextResponse.json(
        { error: "Invalid url format" },
        { status: 400 }
      );
    }

    // Call the library function
    const newLink = await addChainLink(userId, chainId, label, url);
    return NextResponse.json(newLink, { status: 201 });
  } catch (error) {
    console.error("API Error adding chain link:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    // Return specific error messages thrown by the lib function or a generic one
    return NextResponse.json(
      { error: "Failed to add chain link", details: message },
      // Use 400 for constraint violations or validation errors from lib
      {
        status:
          message?.includes("constraint violation") ||
          message?.includes("Invalid")
            ? 400
            : 500,
      }
    );
  } finally {
    // Ensure Prisma disconnects after request
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error(
        "Failed to disconnect Prisma client after POST:",
        disconnectError
      );
    }
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chainId = searchParams.get("chainId");

  if (!chainId) {
    return NextResponse.json(
      { error: "Missing required query parameter: chainId" },
      { status: 400 }
    );
  }

  try {
    // Call the library function
    const links = await getChainLinksByChainId(chainId);
    return NextResponse.json(links, { status: 200 });
  } catch (error) {
    console.error("API Error fetching chain links:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch chain links", details: message },
      { status: 500 } // Or potentially 404 if lib indicates chain not found
    );
  } finally {
    // Ensure Prisma disconnects after request
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error(
        "Failed to disconnect Prisma client after GET:",
        disconnectError
      );
    }
  }
}
