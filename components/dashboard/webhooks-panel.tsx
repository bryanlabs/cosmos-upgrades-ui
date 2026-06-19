"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock3, Save, Send, TestTube2 } from "lucide-react";
import { toast } from "sonner";
import { useUserWebhooks } from "@/hooks/useUserWebhooks";
import { useAllChainData } from "@/hooks/useChainData";
import {
  providerNames,
  renderProviderIcon,
  WebhookRow,
} from "@/components/webhooks/webhook-row";
import { LeadTimePicker } from "@/components/webhooks/lead-time-picker";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  handleRemoveWebhook,
  handleTestSavedWebhook,
  handleUpdateWebhook,
} from "@/utils/chain-detail";
import type { ChainUpgradeStatus } from "@/types/chain";
import type { Webhook } from "@/types/user";

type SortMode = "chain" | "next";

type WebhookRowData = {
  webhook: Webhook;
  chain: ChainUpgradeStatus | undefined;
  timing: WebhookTiming;
};

type WebhookTiming = {
  label: string;
  nextFireMs: number | null;
};

type EditState = {
  webhook: Webhook;
  label: string;
  url: string;
  notificationType: string;
  notifyBeforeMinutes: number | null;
};

export function WebhooksPanel({ enabled }: { enabled: boolean }) {
  const { data, isLoading } = useUserWebhooks(enabled);
  const { data: allChains } = useAllChainData();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(Date.now());
  const [sortMode, setSortMode] = useState<SortMode>("chain");
  const [mockEnabled, setMockEnabled] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleWebhooks = useMemo(() => {
    const live = data ?? [];
    return mockEnabled ? [...live, ...MOCK_WEBHOOKS] : live;
  }, [data, mockEnabled]);

  const chainByNetwork = useMemo(() => {
    const map = new Map<string, ChainUpgradeStatus>();
    [...allChains, ...(mockEnabled ? buildMockChains(now) : [])].forEach((chain) => {
      map.set(chain.network, chain);
    });
    return map;
  }, [allChains, mockEnabled, now]);

  const groupedByChain = useMemo(() => {
    const groups = new Map<string, WebhookRowData[]>();
    visibleWebhooks.forEach((webhook) => {
      const chain = chainByNetwork.get(webhook.chainId);
      const row = {
        webhook,
        chain,
        timing: getWebhookTiming(webhook, chain, now),
      };
      const list = groups.get(webhook.chainId) ?? [];
      list.push(row);
      groups.set(webhook.chainId, list);
    });

    return [...groups.entries()]
      .map(([chainId, rows]) => ({
        chainId,
        rows: rows.sort(compareRows),
        nextFireMs: minNextFire(rows),
      }))
      .sort((a, b) => {
        if (sortMode === "next") {
          return compareMaybeTime(a.nextFireMs, b.nextFireMs);
        }
        return a.chainId.localeCompare(b.chainId);
      });
  }, [chainByNetwork, now, sortMode, visibleWebhooks]);

  const handleRemove = async (id: number) => {
    setRemovingId(id);
    try {
      await handleRemoveWebhook(id);
      await queryClient.invalidateQueries({ queryKey: ["webhooks", "all"] });
    } finally {
      setRemovingId(null);
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      await handleTestSavedWebhook(id);
    } finally {
      setTestingId(null);
    }
  };

  const handleEdit = (webhook: Webhook) => {
    setEditing({
      webhook,
      label: webhook.label,
      url: "",
      notificationType: webhook.notificationType,
      notifyBeforeMinutes: webhook.notifyBeforeMinutes,
    });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!editing.label || !editing.notificationType) {
      toast.warning("Select a provider and trigger.");
      return;
    }
    if (
      editing.notificationType === "before-upgrade" &&
      editing.notifyBeforeMinutes == null
    ) {
      toast.warning("Choose how long before the upgrade to notify.");
      return;
    }

    setIsSavingEdit(true);
    try {
      await handleUpdateWebhook({
        id: editing.webhook.id,
        label: editing.label,
        url: editing.url,
        notificationType: editing.notificationType,
        notifyBeforeMinutes:
          editing.notificationType === "before-upgrade"
            ? editing.notifyBeforeMinutes
            : null,
      });
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["webhooks", "all"] });
    } finally {
      setIsSavingEdit(false);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={sortMode}
            onValueChange={(value) => setSortMode(value as SortMode)}
          >
            <SelectTrigger className="w-[170px]" aria-label="Sort webhooks">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chain">Sort by chain</SelectItem>
              <SelectItem value="next">Sort by next send</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant={mockEnabled ? "default" : "outline"}
            className="gap-2"
            onClick={() => setMockEnabled((value) => !value)}
          >
            <TestTube2 className="h-4 w-4" />
            Mock data
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" />
          {visibleWebhooks.length.toLocaleString()} webhooks
        </div>
      </div>

      {visibleWebhooks.length === 0 ? (
        <EmptyState
          icon={<Send className="h-6 w-6" />}
          title="No webhooks yet"
          description="Open a chain and add a Discord, Slack, or Telegram webhook. They'll all show up here."
        />
      ) : (
        <div className="space-y-6">
          {groupedByChain.map(({ chainId, rows }) => (
            <div key={chainId} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold capitalize">
                  {formatChainName(chainId)}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {rows.length} {rows.length === 1 ? "webhook" : "webhooks"}
                </span>
              </div>
              <ul className="space-y-2">
                {rows.map(({ webhook, timing }) => {
                  const isMock = webhook.id < 0;
                  return (
                    <WebhookRow
                      key={webhook.id}
                      webhook={webhook}
                      nextFireLabel={timing.label}
                      onEdit={isMock ? undefined : handleEdit}
                      onTest={isMock ? undefined : handleTest}
                      onRemove={isMock ? undefined : handleRemove}
                      isRemoving={removingId === webhook.id}
                      isTesting={testingId === webhook.id}
                    />
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="surface-card sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Edit webhook</DialogTitle>
            <DialogDescription>
              Leave the URL blank to keep the current destination.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <Select
                  value={editing.label}
                  onValueChange={(label) =>
                    setEditing((state) => (state ? { ...state, label } : state))
                  }
                >
                  <SelectTrigger aria-label="Provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(providerNames).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          {renderProviderIcon(value)} {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={editing.notificationType}
                  onValueChange={(notificationType) =>
                    setEditing((state) =>
                      state ? { ...state, notificationType } : state
                    )
                  }
                >
                  <SelectTrigger aria-label="Notification trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upgrade-proposed">
                      Upgrade proposed
                    </SelectItem>
                    <SelectItem value="upgrade-planned">
                      Upgrade planned
                    </SelectItem>
                    <SelectItem value="before-upgrade">
                      Before upgrade
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                type="url"
                placeholder={editing.webhook.maskedUrl}
                value={editing.url}
                onChange={(event) =>
                  setEditing((state) =>
                    state ? { ...state, url: event.target.value } : state
                  )
                }
                aria-label="Replacement webhook URL"
              />

              {editing.notificationType === "before-upgrade" && (
                <LeadTimePicker
                  value={editing.notifyBeforeMinutes}
                  onChange={(notifyBeforeMinutes) =>
                    setEditing((state) =>
                      state ? { ...state, notifyBeforeMinutes } : state
                    )
                  }
                />
              )}

              <Button
                type="button"
                className="w-full gap-2"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
              >
                <Save className="h-4 w-4" />
                {isSavingEdit ? "Saving" : "Save webhook"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function compareRows(a: WebhookRowData, b: WebhookRowData) {
  const timeCompare = compareMaybeTime(a.timing.nextFireMs, b.timing.nextFireMs);
  if (timeCompare !== 0) return timeCompare;
  return a.webhook.notificationType.localeCompare(b.webhook.notificationType);
}

function minNextFire(rows: WebhookRowData[]) {
  const values = rows
    .map((row) => row.timing.nextFireMs)
    .filter((value): value is number => value != null);
  return values.length ? Math.min(...values) : null;
}

function compareMaybeTime(a: number | null, b: number | null) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

function getWebhookTiming(
  webhook: Webhook,
  chain: ChainUpgradeStatus | undefined,
  now: number
): WebhookTiming {
  if (webhook.notificationType === "upgrade-proposed") {
    const active = chain?.upgrade_found && chain.source === "active_upgrade_proposals";
    return {
      label:
        active
          ? "Proposal event is active"
          : "Fires when a proposal is detected",
      nextFireMs: active ? now : null,
    };
  }

  if (webhook.notificationType === "upgrade-planned") {
    const active = chain?.upgrade_found && chain.source !== "active_upgrade_proposals";
    return {
      label:
        active
          ? "Planned event is active"
          : "Fires when a plan is detected",
      nextFireMs: active ? now : null,
    };
  }

  if (!chain?.estimated_upgrade_time || webhook.notifyBeforeMinutes == null) {
    return { label: "Waiting for an estimated upgrade time", nextFireMs: null };
  }

  const upgradeTime = Date.parse(chain.estimated_upgrade_time);
  if (!Number.isFinite(upgradeTime)) {
    return { label: "Waiting for an estimated upgrade time", nextFireMs: null };
  }

  const nextFireMs = upgradeTime - webhook.notifyBeforeMinutes * 60_000;
  if (upgradeTime <= now) {
    return { label: "Upgrade window has passed", nextFireMs: null };
  }
  if (nextFireMs <= now) {
    return { label: "Window open; sends on next dispatch", nextFireMs: now };
  }

  return {
    label: `Sends in ${formatDuration(nextFireMs - now)}`,
    nextFireMs,
  };
}

function formatDuration(ms: number) {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60_000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [
    days ? `${days}d` : null,
    hours || days ? `${hours}h` : null,
    !days ? `${minutes}m` : null,
  ].filter(Boolean);
  return parts.join(" ");
}

function formatChainName(network: string) {
  return network
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildMockChains(now: number): ChainUpgradeStatus[] {
  const base = {
    type: "mainnet",
    rpc_server: "",
    rest_server: "",
    latest_block_height: 19654000,
    upgrade_found: true,
    upgrade_name: "v3.0.0",
    source: "active_upgrade_proposals",
    upgrade_block_height: 19807979,
    upgrade_plan: null,
    version: "v3.0.0",
    error: null,
    logo_urls: null,
    explorer_url: null,
  } satisfies Omit<ChainUpgradeStatus, "network" | "estimated_upgrade_time">;

  return [
    { ...base, network: "passage", estimated_upgrade_time: toIso(now, 10) },
    {
      ...base,
      network: "neutron",
      source: "cosmovisor",
      estimated_upgrade_time: toIso(now, 3),
    },
    {
      ...base,
      network: "osmosis",
      source: "software_upgrade_plan",
      estimated_upgrade_time: toIso(now, 1),
    },
    {
      ...base,
      network: "noble",
      source: "active_upgrade_proposals",
      estimated_upgrade_time: toIso(now, 14),
    },
  ];
}

function toIso(now: number, daysFromNow: number) {
  return new Date(now + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
}

const MOCK_WEBHOOKS: Webhook[] = [
  {
    id: -1,
    chainId: "passage",
    label: "discord",
    notificationType: "before-upgrade",
    notifyBeforeMinutes: 1440,
    notifyBeforeLabel: "24 hours",
    maskedUrl: "discord.com/api/...",
  },
  {
    id: -2,
    chainId: "passage",
    label: "slack",
    notificationType: "upgrade-proposed",
    notifyBeforeMinutes: null,
    notifyBeforeLabel: null,
    maskedUrl: "hooks.slack.com/services/...",
  },
  {
    id: -3,
    chainId: "neutron",
    label: "telegram",
    notificationType: "upgrade-planned",
    notifyBeforeMinutes: null,
    notifyBeforeLabel: null,
    maskedUrl: "api.telegram.org/bot.../sendMessage?chat_id=-100...",
  },
  {
    id: -4,
    chainId: "osmosis",
    label: "discord",
    notificationType: "before-upgrade",
    notifyBeforeMinutes: 60,
    notifyBeforeLabel: "1 hour",
    maskedUrl: "discord.com/api/...",
  },
  {
    id: -5,
    chainId: "noble",
    label: "slack",
    notificationType: "before-upgrade",
    notifyBeforeMinutes: 10080,
    notifyBeforeLabel: "1 week",
    maskedUrl: "hooks.slack.com/services/...",
  },
  {
    id: -6,
    chainId: "noble",
    label: "telegram",
    notificationType: "before-upgrade",
    notifyBeforeMinutes: 720,
    notifyBeforeLabel: "12 hours",
    maskedUrl: "api.telegram.org/bot.../sendMessage?chat_id=12345",
  },
];
