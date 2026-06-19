import { NextRequest, NextResponse } from "next/server";
import {
  isWebhookProvider,
  sendWebhook,
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

  const { label, url } = await req.json();

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

  try {
    const result = await sendWebhook(
      { label, url },
      "BryanLabs Upgrade Hub test notification."
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          error: "Webhook endpoint returned an error.",
          status: result.status,
          responseText: result.responseText,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, status: result.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook test failed." },
      { status: 502 }
    );
  }
}
