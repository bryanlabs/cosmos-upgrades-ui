import { ChainUpgradeStatus } from "@/types/chain";

export const WEBHOOK_PROVIDERS = ["discord", "slack", "telegram"] as const;
export const NOTIFICATION_TYPES = [
  "upgrade-proposed",
  "upgrade-planned",
  "before-upgrade",
] as const;

// Legacy fixed lead-time tokens. Retained so rows written before flexible lead
// times (stored as the string `notifyBeforeUpgrade`) still parse. New rows use
// the integer `notifyBeforeMinutes` instead. See toNotifyMinutes().
export const NOTIFY_BEFORE_WINDOWS = ["15m", "60m", "8h", "24h"] as const;

// Flexible lead times, stored as an integer number of minutes.
export const NOTIFY_BEFORE_MIN = 5; // floor: the dispatch cron runs every 5 min
export const NOTIFY_BEFORE_MAX = 30 * 24 * 60; // 30 days
export const NOTIFY_BEFORE_PRESETS = [
  { label: "15 minutes", minutes: 15 },
  { label: "1 hour", minutes: 60 },
  { label: "8 hours", minutes: 480 },
  { label: "24 hours", minutes: 1440 },
  { label: "3 days", minutes: 4320 },
  { label: "7 days", minutes: 10080 },
  { label: "14 days", minutes: 20160 },
] as const;

const UNIT_TO_MINUTES: Record<string, number> = {
  m: 1,
  h: 60,
  d: 60 * 24,
  w: 60 * 24 * 7,
};

const OUTBOUND_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const MAX_RETRY_DELAY_MS = 5_000;
const MAX_WEBHOOK_URL_LENGTH = 2048;

export type WebhookProvider = (typeof WEBHOOK_PROVIDERS)[number];
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type NotifyBeforeWindow = (typeof NOTIFY_BEFORE_WINDOWS)[number];

export type WebhookDestination = {
  label: WebhookProvider;
  url: string;
};

export type DeliveryResult = {
  ok: boolean;
  status: number;
  responseText: string;
};

export function isWebhookProvider(value: unknown): value is WebhookProvider {
  return (
    typeof value === "string" &&
    WEBHOOK_PROVIDERS.includes(value as WebhookProvider)
  );
}

export function isNotificationType(value: unknown): value is NotificationType {
  return (
    typeof value === "string" &&
    NOTIFICATION_TYPES.includes(value as NotificationType)
  );
}

export function isNotifyBeforeWindow(
  value: unknown
): value is NotifyBeforeWindow {
  return (
    typeof value === "string" &&
    NOTIFY_BEFORE_WINDOWS.includes(value as NotifyBeforeWindow)
  );
}

export function isValidNotifyBeforeMinutes(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= NOTIFY_BEFORE_MIN &&
    value <= NOTIFY_BEFORE_MAX
  );
}

// Parse a compact lead-time token ("15m", "8h", "3d", "2w") into minutes.
export function parseWindowToMinutes(value: string): number | null {
  const match = /^(\d+)(m|h|d|w)$/.exec(value.trim());
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  return amount * UNIT_TO_MINUTES[match[2]];
}

// Resolve a webhook's lead time to a canonical integer of minutes, preferring
// the new column and falling back to the legacy string token.
export function toNotifyMinutes(webhook: {
  notifyBeforeMinutes?: number | null;
  notifyBeforeUpgrade?: string | null;
}): number | null {
  if (isValidNotifyBeforeMinutes(webhook.notifyBeforeMinutes)) {
    return webhook.notifyBeforeMinutes;
  }
  if (webhook.notifyBeforeUpgrade) {
    const parsed = parseWindowToMinutes(webhook.notifyBeforeUpgrade);
    if (parsed != null && isValidNotifyBeforeMinutes(parsed)) return parsed;
  }
  return null;
}

export function formatNotifyBefore(minutes: number): string {
  const week = 60 * 24 * 7;
  const day = 60 * 24;
  if (minutes % week === 0) {
    const value = minutes / week;
    return `${value} week${value === 1 ? "" : "s"}`;
  }
  if (minutes % day === 0) {
    const value = minutes / day;
    return `${value} day${value === 1 ? "" : "s"}`;
  }
  if (minutes % 60 === 0) {
    const value = minutes / 60;
    return `${value} hour${value === 1 ? "" : "s"}`;
  }
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function validateWebhookUrl(provider: WebhookProvider, rawUrl: string) {
  if (typeof rawUrl !== "string" || rawUrl.length > MAX_WEBHOOK_URL_LENGTH) {
    throw new Error("Webhook URL is invalid or too long.");
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Webhook URL must be a valid URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Webhook URL must use HTTPS.");
  }

  // Only the default HTTPS port is allowed; a custom port is a probing vector.
  if (parsed.port && parsed.port !== "443") {
    throw new Error("Webhook URL must use the default HTTPS port.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Webhook URL must not include embedded credentials.");
  }

  if (
    provider === "discord" &&
    !(
      ["discord.com", "discordapp.com"].includes(parsed.hostname) &&
      parsed.pathname.startsWith("/api/webhooks/")
    )
  ) {
    throw new Error("Discord webhooks must use discord.com/api/webhooks.");
  }

  if (
    provider === "slack" &&
    !(parsed.hostname === "hooks.slack.com" && parsed.pathname.startsWith("/services/"))
  ) {
    throw new Error("Slack webhooks must use hooks.slack.com/services.");
  }

  if (provider === "telegram") {
    const isTelegramEndpoint =
      parsed.hostname === "api.telegram.org" &&
      /^\/bot[^/]+\/sendMessage$/.test(parsed.pathname);
    if (!isTelegramEndpoint || !parsed.searchParams.get("chat_id")) {
      throw new Error(
        "Telegram webhooks must use api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>."
      );
    }
  }

  return parsed;
}

export function maskWebhookUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (url.hostname === "api.telegram.org") {
      url.pathname = url.pathname.replace(/\/bot[^/]+\//, "/bot.../");
      return `${url.hostname}${url.pathname}?chat_id=${url.searchParams.get(
        "chat_id"
      )}`;
    }
    const pathParts = url.pathname.split("/").filter(Boolean);
    const safePath = pathParts.slice(0, 2).join("/");
    return `${url.hostname}/${safePath}/...`;
  } catch {
    return "Invalid URL";
  }
}

export async function sendWebhook(
  destination: WebhookDestination,
  message: string,
  chain?: ChainUpgradeStatus
): Promise<DeliveryResult> {
  const url = validateWebhookUrl(destination.label, destination.url);
  const { body, targetUrl } = buildProviderPayload(
    destination.label,
    url,
    message,
    chain
  );

  let lastResult: DeliveryResult = {
    ok: false,
    status: 0,
    responseText: "",
  };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OUTBOUND_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(targetUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        redirect: "error", // a webhook endpoint never legitimately redirects
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const responseText = (await response.text()).slice(0, 500);
    lastResult = { ok: response.ok, status: response.status, responseText };

    // Only 429s are worth retrying inline; everything else is returned (and, on
    // failure, retried by the next 5-minute dispatch run).
    if (response.status !== 429 || attempt === MAX_RETRIES) {
      return lastResult;
    }

    const delay = Math.min(
      parseRetryAfterMs(response, responseText),
      MAX_RETRY_DELAY_MS
    );
    await sleep(delay);
  }

  return lastResult;
}

export function buildUpgradeMessage(
  chain: ChainUpgradeStatus,
  notificationType: NotificationType
) {
  const chainName = formatChainName(chain.network);
  const title =
    notificationType === "before-upgrade"
      ? `${chainName} upgrade window approaching`
      : notificationType === "upgrade-proposed"
        ? `${chainName} upgrade proposal is in voting`
        : `${chainName} upgrade planned`;
  const height = chain.upgrade_block_height
    ? chain.upgrade_block_height.toLocaleString()
    : "unknown";
  const time = chain.estimated_upgrade_time
    ? new Date(chain.estimated_upgrade_time).toISOString()
    : "unknown";

  return `${title}\nNetwork: ${chain.network}\nVersion: ${
    chain.version || "unknown"
  }\nUpgrade: ${chain.upgrade_name || "unknown"}\nHeight: ${height}\nEstimated time: ${time}\nSource: ${formatSource(
    chain.source
  )}`;
}

// One delivery per (webhook, event). The lead time is folded in as canonical
// integer minutes so a re-scheduled upgrade (new height/name) re-alerts while a
// pure ETA wobble at the same height does not.
//
// Migration note: deliveries recorded before flexible lead times keyed the
// segment as the legacy token ("24h"); new evaluations key it as minutes
// ("1440"). A before-upgrade alert that already fired for an in-flight upgrade
// may therefore re-send once at rollout. This is bounded and harmless.
export function buildWebhookEventKey(
  chain: ChainUpgradeStatus,
  notificationType: NotificationType,
  notifyBeforeMinutes?: number | null
) {
  return [
    chain.network,
    chain.type,
    notificationType,
    notifyBeforeMinutes ?? "now",
    chain.upgrade_block_height || "unknown-height",
    chain.upgrade_name || "unknown-upgrade",
    chain.source || "unknown-source",
  ].join(":");
}

function buildProviderPayload(
  provider: WebhookProvider,
  url: URL,
  message: string,
  chain?: ChainUpgradeStatus
) {
  if (provider === "discord") {
    const title = chain
      ? `${formatChainName(chain.network)} upgrade`
      : "Cosmos Upgrade Hub";
    return {
      targetUrl: url,
      body: {
        // Never let a chain name resolve to an @everyone/@here/role mention.
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title,
            description: message,
            color: 0x60a5fa,
          },
        ],
      },
    };
  }

  if (provider === "slack") {
    const [titleLine, ...rest] = message.split("\n");
    const bodyText = rest
      .map((line) => escapeSlackMrkdwn(line).replace(/^([^:]+):/, "*$1:*"))
      .join("\n");
    return {
      targetUrl: url,
      body: {
        text: message, // notification/accessibility fallback
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: titleLine.slice(0, 150),
              emoji: true,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: bodyText || escapeSlackMrkdwn(titleLine),
            },
          },
        ],
      },
    };
  }

  const chatId = url.searchParams.get("chat_id");
  url.searchParams.delete("chat_id");
  return {
    targetUrl: url,
    body: {
      chat_id: chatId,
      // Plain text on purpose: avoids MarkdownV2/HTML escaping pitfalls.
      text: message,
      disable_web_page_preview: true,
    },
  };
}

function parseRetryAfterMs(response: Response, responseText: string): number {
  const header = response.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return seconds * 1000;
    const date = Date.parse(header);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  }
  // Discord: { retry_after: <seconds> }; Telegram: { parameters: { retry_after } }.
  try {
    const parsed = JSON.parse(responseText);
    const seconds = parsed?.retry_after ?? parsed?.parameters?.retry_after;
    if (seconds != null && Number.isFinite(Number(seconds))) {
      return Number(seconds) * 1000;
    }
  } catch {
    // response body was not JSON; fall through to default
  }
  return 1000;
}

function escapeSlackMrkdwn(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatChainName(network: string) {
  return network
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSource(source: string) {
  return source ? source.replace(/_/g, " ") : "unknown";
}
