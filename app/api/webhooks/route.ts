// app/api/webhooks/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getWebHooksByUserAndChain,
  getWebHooksByUserId,
  countWebHooksByUserId,
  getWebHookByIdForUser,
  addWebHook,
  updateWebHook,
  removeWebHookForUser,
} from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import {
  formatNotifyBefore,
  isNotificationType,
  isValidNotifyBeforeMinutes,
  isWebhookProvider,
  maskWebhookUrl,
  parseWindowToMinutes,
  toNotifyMinutes,
  validateWebhookUrl,
} from "@/lib/webhook-delivery";
import { decryptSecret } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_WEBHOOKS_PER_CHAIN = 10;
const MAX_WEBHOOKS_PER_USER = 50;
const MAX_CHAIN_ID_LENGTH = 80;
const CREATE_RATE_LIMIT = 20;
const CREATE_RATE_WINDOW_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const chainId = searchParams.get("chainId");

  try {
    // Omitting chainId returns every webhook the user has, grouped client-side
    // (powers the dashboard). With chainId, returns just that chain's webhooks.
    const webhooks = chainId
      ? await getWebHooksByUserAndChain(user.id, chainId)
      : await getWebHooksByUserId(user.id);
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

  const limit = rateLimit(
    `webhooks:create:${user.id}`,
    CREATE_RATE_LIMIT,
    CREATE_RATE_WINDOW_MS
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many webhook changes. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await req.json();
  const { chainId, label, url, notificationType } = body;

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

  // Resolve the lead time (in minutes) for "before-upgrade" alerts, accepting a
  // numeric value or a legacy "Xm/Xh/Xd/Xw" token for backward compatibility.
  let notifyBeforeMinutes: number | null = null;
  if (notificationType === "before-upgrade") {
    if (typeof body.notifyBeforeMinutes === "number") {
      notifyBeforeMinutes = body.notifyBeforeMinutes;
    } else if (typeof body.notifyBeforeUpgrade === "string") {
      notifyBeforeMinutes = parseWindowToMinutes(body.notifyBeforeUpgrade);
    }
    if (!isValidNotifyBeforeMinutes(notifyBeforeMinutes)) {
      return NextResponse.json(
        { error: "Choose a lead time between 5 minutes and 30 days." },
        { status: 400 }
      );
    }
  } else if (body.notifyBeforeMinutes != null || body.notifyBeforeUpgrade != null) {
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
    const [existing, total] = await Promise.all([
      getWebHooksByUserAndChain(user.id, chainId),
      countWebHooksByUserId(user.id),
    ]);
    if (existing.length >= MAX_WEBHOOKS_PER_CHAIN) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_WEBHOOKS_PER_CHAIN} webhooks per chain reached.` },
        { status: 400 }
      );
    }
    if (total >= MAX_WEBHOOKS_PER_USER) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_WEBHOOKS_PER_USER} webhooks reached.` },
        { status: 400 }
      );
    }

    const webhook = await addWebHook(
      user.id,
      chainId,
      label,
      url,
      notificationType,
      notifyBeforeMinutes
    );
    return NextResponse.json(serializeWebhook(webhook));
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = rateLimit(
    `webhooks:update:${user.id}`,
    CREATE_RATE_LIMIT,
    CREATE_RATE_WINDOW_MS
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many webhook changes. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await req.json();
  const webhookId = Number(body.id);
  const { label, url, notificationType } = body;

  if (
    !Number.isInteger(webhookId) ||
    !label ||
    !notificationType
  ) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await getWebHookByIdForUser(webhookId, user.id);
  if (!existing) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  if (!isWebhookProvider(label)) {
    return NextResponse.json({ error: "Unsupported webhook type" }, { status: 400 });
  }

  if (!isNotificationType(notificationType)) {
    return NextResponse.json({ error: "Unsupported notification trigger" }, { status: 400 });
  }

  let notifyBeforeMinutes: number | null = null;
  if (notificationType === "before-upgrade") {
    if (typeof body.notifyBeforeMinutes === "number") {
      notifyBeforeMinutes = body.notifyBeforeMinutes;
    } else if (typeof body.notifyBeforeUpgrade === "string") {
      notifyBeforeMinutes = parseWindowToMinutes(body.notifyBeforeUpgrade);
    }
    if (!isValidNotifyBeforeMinutes(notifyBeforeMinutes)) {
      return NextResponse.json(
        { error: "Choose a lead time between 5 minutes and 30 days." },
        { status: 400 }
      );
    }
  } else if (body.notifyBeforeMinutes != null || body.notifyBeforeUpgrade != null) {
    return NextResponse.json(
      { error: "Notification window only applies before an upgrade" },
      { status: 400 }
    );
  }

  const nextUrl = typeof url === "string" && url.trim() ? url.trim() : null;
  if (nextUrl) {
    try {
      validateWebhookUrl(label, nextUrl);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid webhook URL" },
        { status: 400 }
      );
    }
  } else if (label !== existing.label) {
    return NextResponse.json(
      { error: "Enter a new URL when changing webhook providers." },
      { status: 400 }
    );
  }

  try {
    const webhook = await updateWebHook(webhookId, user.id, {
      label,
      ...(nextUrl ? { url: nextUrl } : {}),
      notificationType,
      notifyBeforeMinutes,
      notifyBeforeUpgrade: null,
    });
    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }
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
  notifyBeforeMinutes: number | null;
}) {
  const minutes = toNotifyMinutes(webhook);
  return {
    id: webhook.id,
    chainId: webhook.chainId,
    label: webhook.label,
    notificationType: webhook.notificationType,
    notifyBeforeMinutes: minutes,
    notifyBeforeLabel: minutes != null ? formatNotifyBefore(minutes) : null,
    maskedUrl: maskWebhookUrl(decryptSecret(webhook.url)),
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
