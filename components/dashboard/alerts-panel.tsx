"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { useUserWebhooks } from "@/hooks/useUserWebhooks";
import { WebhookRow } from "@/components/webhooks/webhook-row";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { handleRemoveWebhook } from "@/utils/chain-detail";
import type { Webhook } from "@/types/user";

export function AlertsPanel({ enabled }: { enabled: boolean }) {
  const { data, isLoading } = useUserWebhooks(enabled);
  const queryClient = useQueryClient();
  const [removingId, setRemovingId] = useState<number | null>(null);

  const groupedByChain = useMemo(() => {
    const map = new Map<string, Webhook[]>();
    (data ?? []).forEach((webhook) => {
      const list = map.get(webhook.chainId) ?? [];
      list.push(webhook);
      map.set(webhook.chainId, list);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [data]);

  const handleRemove = async (id: number) => {
    setRemovingId(id);
    try {
      await handleRemoveWebhook(id);
      await queryClient.invalidateQueries({ queryKey: ["webhooks", "all"] });
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<BellRing className="h-6 w-6" />}
        title="No alerts yet"
        description="Open a chain from the explorer and add a Discord, Slack, or Telegram alert. They'll all show up here."
      />
    );
  }

  return (
    <div className="space-y-6">
      {groupedByChain.map(([chainId, webhooks]) => (
        <div key={chainId} className="space-y-2">
          <h3 className="text-sm font-semibold capitalize">{chainId}</h3>
          <ul className="space-y-2">
            {webhooks.map((webhook) => (
              <WebhookRow
                key={webhook.id}
                webhook={webhook}
                onRemove={handleRemove}
                isRemoving={removingId === webhook.id}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
