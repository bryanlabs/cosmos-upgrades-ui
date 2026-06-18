// app/api/webhooks/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getWebHooksByUserAndChain,
  addWebHook,
  removeWebHookForUser,
} from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import {
  isNotificationType,
  isNotifyBeforeWindow,
  isWebhookProvider,
  maskWebhookUrl,
  validateWebhookUrl,
} from "@/lib/webhook-delivery";

const MAX_WEBHOOKS_PER_CHAIN = 4;
const MAX_CHAIN_ID_LENGTH = 80;

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const chainId = searchParams.get("chainId");

  if (!chainId) {
    return NextResponse.json(
      { error: "Missing chainId" },
      { status: 400 }
    );
  }

  try {
    const webhooks = await getWebHooksByUserAndChain(user.id, chainId);
    return NextResponse.json(webhooks.map(serializeWebhook));
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { chainId, label, url, notificationType, notifyBeforeUpgrade } = body;

  if (!chainId || !label || !url || !notificationType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!isValidChainId(chainId)) {
    return NextResponse.json({ error: "Invalid chain" }, { status: 400 });
  }

  if (!isWebhookProvider(label)) {
    return NextResponse.json({ error: "Unsupported webhook type" }, { status: 400 });
  }

  if (!isNotificationType(notificationType)) {
    return NextResponse.json({ error: "Unsupported notification trigger" }, { status: 400 });
  }

  if (
    notificationType === "before-upgrade" &&
    !isNotifyBeforeWindow(notifyBeforeUpgrade)
  ) {
    return NextResponse.json(
      { error: "Unsupported notification window" },
      { status: 400 }
    );
  }

  if (notificationType !== "before-upgrade" && notifyBeforeUpgrade) {
    return NextResponse.json(
      { error: "Notification window only applies before an upgrade" },
      { status: 400 }
    );
  }

  try {
    validateWebhookUrl(label, url);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid webhook URL" },
      { status: 400 }
    );
  }

  try {
    const existing = await getWebHooksByUserAndChain(user.id, chainId);
    if (existing.length >= MAX_WEBHOOKS_PER_CHAIN) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_WEBHOOKS_PER_CHAIN} webhooks reached.` },
        { status: 400 }
      );
    }

    const webhook = await addWebHook(
      user.id,
      chainId,
      label,
      url,
      notificationType,
      notificationType === "before-upgrade" ? notifyBeforeUpgrade : undefined
    );
    return NextResponse.json(serializeWebhook(webhook));
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  const webhookId = Number(id);

  if (!Number.isInteger(webhookId)) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const removed = await removeWebHookForUser(webhookId, user.id);
    return NextResponse.json(removed ? serializeWebhook(removed) : null);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

function serializeWebhook(webhook: {
  id: number;
  label: string;
  url: string;
  chainId: string;
  notificationType: string;
  notifyBeforeUpgrade: string | null;
}) {
  return {
    id: webhook.id,
    chainId: webhook.chainId,
    label: webhook.label,
    notificationType: webhook.notificationType,
    notifyBeforeUpgrade: webhook.notifyBeforeUpgrade,
    maskedUrl: maskWebhookUrl(webhook.url),
  };
}

function isValidChainId(chainId: unknown): chainId is string {
  return (
    typeof chainId === "string" &&
    chainId.length > 0 &&
    chainId.length <= MAX_CHAIN_ID_LENGTH &&
    /^[a-zA-Z0-9._-]+$/.test(chainId)
  );
}
