// app/api/webhooks/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getWebHooksByUserAndChain,
  addWebHook,
  removeWebHook,
} from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = parseInt(searchParams.get("userId") || "");
  const chainId = searchParams.get("chainId");

  if (!userId || !chainId) {
    return NextResponse.json(
      { error: "Missing userId or chainId" },
      { status: 400 }
    );
  }

  try {
    const webhooks = await getWebHooksByUserAndChain(userId, chainId);
    return NextResponse.json(webhooks);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { userId, chainId, label, url, notificationType, notifyBeforeUpgrade } =
    await req.json();

  if (!userId || !chainId || !label || !url || !notificationType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const webhook = await addWebHook(
      userId,
      chainId,
      label,
      url,
      notificationType,
      notifyBeforeUpgrade
    );
    return NextResponse.json(webhook);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const removed = await removeWebHook(id);
    return NextResponse.json(removed);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
