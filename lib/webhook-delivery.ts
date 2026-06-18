import { ChainUpgradeStatus } from "@/types/chain";

export const WEBHOOK_PROVIDERS = ["discord", "slack", "telegram"] as const;
export const NOTIFICATION_TYPES = [
  "upgrade-proposed",
  "upgrade-planned",
  "before-upgrade",
] as const;
export const NOTIFY_BEFORE_WINDOWS = ["15m", "60m", "8h", "24h"] as const;

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

export function validateWebhookUrl(provider: WebhookProvider, rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Webhook URL must be a valid URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Webhook URL must use HTTPS.");
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

  const response = await fetch(targetUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const responseText = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    responseText: responseText.slice(0, 500),
  };
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

export function buildWebhookEventKey(
  chain: ChainUpgradeStatus,
  notificationType: NotificationType,
  notifyBeforeUpgrade?: string | null
) {
  return [
    chain.network,
    chain.type,
    notificationType,
    notifyBeforeUpgrade || "now",
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
    return {
      targetUrl: url,
      body: {
        content: message,
        embeds: chain
          ? [
              {
                title: `${formatChainName(chain.network)} upgrade`,
                description: message,
                color: 0x60a5fa,
              },
            ]
          : undefined,
      },
    };
  }

  if (provider === "slack") {
    return {
      targetUrl: url,
      body: {
        text: message,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: message
                .split("\n")
                .map((line) => line.replace(/^([^:]+):/, "*$1:*"))
                .join("\n"),
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
      text: message,
      disable_web_page_preview: true,
    },
  };
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
