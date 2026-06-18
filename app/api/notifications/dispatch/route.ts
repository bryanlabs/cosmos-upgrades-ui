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
  isNotifyBeforeWindow,
  isWebhookProvider,
  sendWebhook,
} from "@/lib/webhook-delivery";

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

  const headerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (headerToken !== dispatchToken) {
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

      if (
        webhook.notificationType === "before-upgrade" &&
        !isNotifyBeforeWindow(webhook.notifyBeforeUpgrade)
      ) {
        summary.skipped += 1;
        continue;
      }

      if (!shouldDispatch(chain, webhook.notificationType, webhook.notifyBeforeUpgrade, now)) {
        summary.skipped += 1;
        continue;
      }

      const eventKey = buildWebhookEventKey(
        chain,
        webhook.notificationType,
        webhook.notifyBeforeUpgrade
      );

      if (await hasWebhookDelivery(webhook.id, eventKey)) {
        summary.skipped += 1;
        continue;
      }

      try {
        const result = await sendWebhook(
          { label: webhook.label, url: webhook.url },
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
  notifyBeforeUpgrade: string | null,
  now: number
) {
  if (notificationType === "upgrade-proposed") {
    return chain.source === "active_upgrade_proposals";
  }

  if (notificationType === "upgrade-planned") {
    return chain.source !== "active_upgrade_proposals";
  }

  if (!chain.estimated_upgrade_time || !notifyBeforeUpgrade) {
    return false;
  }

  const targetTime = new Date(chain.estimated_upgrade_time).getTime();
  if (!Number.isFinite(targetTime) || targetTime < now) {
    return false;
  }

  const windowMs = parseWindowMs(notifyBeforeUpgrade);
  return targetTime - now <= windowMs;
}

function parseWindowMs(value: string) {
  const match = value.match(/^(\d+)(m|h)$/);
  if (!match) return 0;

  const amount = Number(match[1]);
  return match[2] === "h" ? amount * 60 * 60 * 1000 : amount * 60 * 1000;
}
