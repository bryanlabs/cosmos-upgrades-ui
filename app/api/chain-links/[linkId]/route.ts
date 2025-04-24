import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client"; // For disconnect
import { updateChainLink, removeChainLink } from "@/lib/prisma";

const prisma = new PrismaClient(); // Instantiate client for disconnect

// PATCH handler for updating a specific chain link
export async function PATCH(
  req: NextRequest,
  { params }: { params: { linkId: string } }
) {
  const linkId = Number(params.linkId);
  if (isNaN(linkId)) {
    return NextResponse.json(
      { error: "Invalid link ID format" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    // Extract only label and url for update
    const { label, url } = body;

    // Validate that at least one field is provided for update
    if (label === undefined && url === undefined) {
      return NextResponse.json(
        { error: "Missing data for update: provide label or url" },
        { status: 400 }
      );
    }

    // Prepare update data object
    const updateData: { label?: string; url?: string } = {};
    if (label !== undefined) updateData.label = label;
    if (url !== undefined) updateData.url = url;

    // Call the library function
    const updatedLink = await updateChainLink(linkId, updateData);

    // updateChainLink throws error if not found, caught below
    return NextResponse.json(updatedLink, { status: 200 });
  } catch (error) {
    console.error(`API Error updating chain link ${linkId}:`, error);
    const message = error instanceof Error ? error.message : "Unknown error";
    // Check for specific errors thrown by lib function
    const status = message.includes("not found")
      ? 404
      : message.includes("Invalid")
      ? 400
      : 500;
    return NextResponse.json(
      { error: "Failed to update chain link", details: message },
      { status: status }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error(
        "Failed to disconnect Prisma client after PATCH:",
        disconnectError
      );
    }
  }
}

// DELETE handler for removing a specific chain link
export async function DELETE(
  req: NextRequest, // request object might not be needed but good practice to include
  { params }: { params: { linkId: string } }
) {
  const linkId = Number(params.linkId);
  if (isNaN(linkId)) {
    return NextResponse.json(
      { error: "Invalid link ID format" },
      { status: 400 }
    );
  }

  try {
    // Call the library function
    const deletedLink = await removeChainLink(linkId);

    if (deletedLink === null) {
      // removeChainLink returns null if record not found (as implemented)
      return NextResponse.json(
        { message: `Chain link with ID ${linkId} not found` },
        { status: 404 }
      );
    }

    // Successfully deleted
    // Return 204 No Content or 200 OK with the deleted item/message
    // return new NextResponse(null, { status: 204 }); // Option 1: No Content
    return NextResponse.json(
      { message: "Chain link deleted successfully", deletedLink },
      { status: 200 }
    ); // Option 2: OK with info
  } catch (error) {
    console.error(`API Error removing chain link ${linkId}:`, error);
    const message = error instanceof Error ? error.message : "Unknown error";
    // removeChainLink handles 'not found' gracefully, so other errors are likely 500
    return NextResponse.json(
      { error: "Failed to remove chain link", details: message },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error(
        "Failed to disconnect Prisma client after DELETE:",
        disconnectError
      );
    }
  }
}
