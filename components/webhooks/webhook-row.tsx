"use client";

import { Pencil, Send, TestTube2, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiscordIcon, SlackIcon } from "@/components/icons";
import type { Webhook } from "@/types/user";

export const providerNames: Record<string, string> = {
  discord: "Discord",
  slack: "Slack",
  telegram: "Telegram",
};

export function renderProviderIcon(label: string) {
  if (label === "discord") return <DiscordIcon size={16} />;
  if (label === "slack") return <SlackIcon size={16} />;
  return <Send className="h-4 w-4 text-muted-foreground" />;
}

// A single configured webhook. Shared by the per-chain dialog and the dashboard
// webhooks panel so both stay visually identical.
export function WebhookRow({
  webhook,
  nextFireLabel,
  onEdit,
  onTest,
  onRemove,
  isRemoving,
  isTesting,
}: {
  webhook: Webhook;
  nextFireLabel?: string | null;
  onEdit?: (webhook: Webhook) => void;
  onTest?: (id: number) => void;
  onRemove?: (id: number) => void;
  isRemoving?: boolean;
  isTesting?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
          {renderProviderIcon(webhook.label)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {providerNames[webhook.label] || webhook.label}
            </span>
            <span className="text-xs capitalize text-muted-foreground">
              {webhook.notificationType.replace(/-/g, " ")}
              {webhook.notificationType === "before-upgrade" &&
                webhook.notifyBeforeLabel &&
                ` (${webhook.notifyBeforeLabel})`}
            </span>
          </div>
          <span className="block max-w-[180px] truncate text-xs text-muted-foreground sm:max-w-[380px]">
            {webhook.maskedUrl}
          </span>
          {nextFireLabel && (
            <span className="block truncate text-xs text-muted-foreground">
              {nextFireLabel}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {onTest && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onTest(webhook.id)}
            aria-label={`Test ${webhook.label} webhook`}
            disabled={isTesting}
          >
            <TestTube2 className="h-4 w-4" />
          </Button>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(webhook)}
            aria-label={`Edit ${webhook.label} webhook`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(webhook.id)}
            aria-label={`Remove ${webhook.label} webhook`}
            disabled={isRemoving}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </li>
  );
}
