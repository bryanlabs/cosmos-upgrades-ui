import { NextRequest, NextResponse } from "next/server";
import { ChainUpgradeStatus } from "@/types/chain";
import {
  getWebHooksByChainId,
  hasWebhookDelivery,
  recordWebhookDelivery,
} from "@/lib/prisma";
import {
  buildUpgradeMessage,
  buildWebhookEventKey,
  isNotificationType,
  isWebhookProvider,
  sendWebhook,
  toNotifyMinutes,
} from "@/lib/webhook-delivery";
import { decryptSecret, timingSafeEqualStr } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BASE_URL =
  process.env.COSMOS_UPGRADES_API_BASE_URL ||
  "https://cosmos-upgrades.bryanlabs.net";

export async function POST(req: NextRequest) {
  const dispatchToken = process.env.NOTIFICATION_DISPATCH_TOKEN;
  if (!dispatchToken) {
    return NextResponse.json(
      { error: "Notification dispatch is not configured." },
      { status: 503 }
    );
  }

  const headerToken = req.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!headerToken || !timingSafeEqualStr(headerToken, dispatchToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chains = await fetchUpgradeChains();
  const now = Date.now();
  const summary = {
    chainsChecked: chains.length,
    webhooksChecked: 0,
    delivered: 0,
    skipped: 0,
    failed: 0,
  };

  for (const chain of chains) {
    if (!chain.upgrade_found) continue;

    const webhooks = await getWebHooksByChainId(chain.network);
    for (const webhook of webhooks) {
      summary.webhooksChecked += 1;

      if (
        !isWebhookProvider(webhook.label) ||
        !isNotificationType(webhook.notificationType)
      ) {
        summary.skipped += 1;
        continue;
      }

      const notifyBeforeMinutes = toNotifyMinutes(webhook);
      if (
        webhook.notificationType === "before-upgrade" &&
        notifyBeforeMinutes == null
      ) {
        summary.skipped += 1;
        continue;
      }

      if (
        !shouldDispatch(
          chain,
          webhook.notificationType,
          notifyBeforeMinutes,
          now
        )
      ) {
        summary.skipped += 1;
        continue;
      }

      const eventKey = buildWebhookEventKey(
        chain,
        webhook.notificationType,
        webhook.notificationType === "before-upgrade" ? notifyBeforeMinutes : null
      );

      if (await hasWebhookDelivery(webhook.id, eventKey)) {
        summary.skipped += 1;
        continue;
      }

      try {
        const result = await sendWebhook(
          { label: webhook.label, url: decryptSecret(webhook.url) },
          buildUpgradeMessage(chain, webhook.notificationType),
          chain
        );
        await recordWebhookDelivery({
          webHookId: webhook.id,
          eventKey,
          status: result.ok ? "delivered" : "failed",
          responseCode: result.status,
          responseText: result.responseText,
          error: result.ok ? undefined : "Webhook endpoint returned an error.",
        });

        if (result.ok) summary.delivered += 1;
        else summary.failed += 1;
      } catch (error) {
        await recordWebhookDelivery({
          webHookId: webhook.id,
          eventKey,
          status: "failed",
          error:
            error instanceof Error ? error.message : "Unknown delivery error.",
        });
        summary.failed += 1;
      }
    }
  }

  return NextResponse.json(summary);
}

async function fetchUpgradeChains() {
  const [mainnets, testnets] = await Promise.all([
    fetchJson(`${API_BASE_URL}/mainnets`),
    fetchJson(`${API_BASE_URL}/testnets`),
  ]);

  return [...mainnets, ...testnets];
}

async function fetchJson(url: string): Promise<ChainUpgradeStatus[]> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
}

function shouldDispatch(
  chain: ChainUpgradeStatus,
  notificationType: string,
  notifyBeforeMinutes: number | null,
  now: number
) {
  if (notificationType === "upgrade-proposed") {
    return chain.source === "active_upgrade_proposals";
  }

  if (notificationType === "upgrade-planned") {
    return chain.source !== "active_upgrade_proposals";
  }

  // before-upgrade
  if (!chain.estimated_upgrade_time || notifyBeforeMinutes == null) {
    return false;
  }

  const targetTime = new Date(chain.estimated_upgrade_time).getTime();
  if (!Number.isFinite(targetTime) || targetTime < now) {
    return false;
  }

  // Fire once the upgrade is within the lead-time window. The delivery dedup
  // (eventKey) keeps a long window (days/weeks) from re-firing every 5 minutes;
  // an alert added when already inside its window fires on the next run.
  const windowMs = notifyBeforeMinutes * 60_000;
  return targetTime - now <= windowMs;
}
