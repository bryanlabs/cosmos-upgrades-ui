import { NextRequest, NextResponse } from "next/server";
import type { ChainUpgradeStatus } from "@/types/chain";
import { decryptSecret } from "@/lib/crypto";
import { getWebHookByIdForUser } from "@/lib/prisma";
import {
  buildUpgradeMessage,
  isNotificationType,
  isWebhookProvider,
  NOTIFICATION_TYPES,
  sendWebhook,
  type NotificationType,
  validateWebhookUrl,
} from "@/lib/webhook-delivery";
import { getCurrentUser } from "@/lib/current-user";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// The test endpoint sends to a user-supplied (allowlisted) host, so it is the
// most abusable relay. Cap it tightly per user.
const TEST_RATE_LIMIT = 5;
const TEST_RATE_WINDOW_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = rateLimit(
    `webhooks:test:${user.id}`,
    TEST_RATE_LIMIT,
    TEST_RATE_WINDOW_MS
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many test sends. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await req.json();
  const webhookId = body.id == null ? null : Number(body.id);
  let label = body.label;
  let url = body.url;

  if (webhookId != null) {
    if (!Number.isInteger(webhookId)) {
      return NextResponse.json({ error: "Valid webhook ID is required." }, { status: 400 });
    }
    const webhook = await getWebHookByIdForUser(webhookId, user.id);
    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found." }, { status: 404 });
    }
    label = webhook.label;
    url = decryptSecret(webhook.url);
  }

  if (!isWebhookProvider(label) || typeof url !== "string") {
    return NextResponse.json(
      { error: "Webhook type and URL are required." },
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

  let eventTypes: NotificationType[];
  try {
    eventTypes = resolveTestEventTypes(body.eventType);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid test event." },
      { status: 400 }
    );
  }

  try {
    const sampleChain = buildSampleChain();
    const results = [];
    for (const eventType of eventTypes) {
      const message = `[TEST] ${buildUpgradeMessage(sampleChain, eventType)}`;
      const result = await sendWebhook(
        { label, url },
        message,
        sampleChain
      );
      results.push({ eventType, status: result.status, ok: result.ok });

      if (!result.ok) {
        return NextResponse.json(
          {
            error: "Webhook endpoint returned an error.",
            status: result.status,
            responseText: result.responseText,
            results,
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook test failed." },
      { status: 502 }
    );
  }
}

function resolveTestEventTypes(value: unknown): NotificationType[] {
  if (value === "all" || value == null) return [...NOTIFICATION_TYPES];
  if (isNotificationType(value)) return [value];
  throw new Error("Unsupported test event type.");
}

function buildSampleChain(): ChainUpgradeStatus {
  return {
    type: "mainnet",
    network: "passage",
    rpc_server: "https://rpc-passage.example.invalid",
    rest_server: "https://rest-passage.example.invalid",
    latest_block_height: 19654000,
    upgrade_found: true,
    upgrade_name: "v3.0.0",
    source: "active_upgrade_proposals",
    upgrade_block_height: 19807979,
    estimated_upgrade_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      .toISOString(),
    upgrade_plan: JSON.stringify({ name: "v3.0.0", height: "19807979" }),
    version: "v3.0.0",
    error: null,
    logo_urls: null,
    explorer_url: null,
  };
}
