"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  BellRing,
  CalendarClock,
  ExternalLink,
  PlusIcon,
  Send,
  TestTube2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWebhooks } from "@/hooks/useWebhooks";
import { useUserData } from "@/hooks/useUserData";
import { ChainUpgradeStatus } from "@/types/chain";
import { Badge } from "@/components/ui/badge";
import { getBadgeProps } from "@/utils/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DiscordIcon, SlackIcon } from "./icons/index";
import { LeadTimePicker } from "@/components/webhooks/lead-time-picker";
import { WebhookRow } from "@/components/webhooks/webhook-row";
import { toast } from "sonner";

interface ChainDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chain: ChainUpgradeStatus | null;
}

export const ChainDetailDialog = ({
  isOpen,
  onClose,
  chain,
}: ChainDetailDialogProps) => {
  const {
    isLoading: isLoadingUser,
    error: userError,
    isAuthenticated,
  } = useUserData();

  const {
    webhooks,
    isLoading: isLoadingWebhooks,
    error: webhookError,
    fetchWebhooks,
    addWebhook,
    removeWebhook,
  } = useWebhooks({
    chainId: chain?.network,
    isAuthenticated,
  });

  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [notificationType, setNotificationType] = useState("");
  const [notifyBeforeMinutes, setNotifyBeforeMinutes] = useState<number | null>(
    null
  );
  const [isTesting, setIsTesting] = useState(false);

  const resetForm = () => {
    setUrl("");
    setLabel("");
    setNotificationType("");
    setNotifyBeforeMinutes(null);
  };

  useEffect(() => {
    if (isOpen && isAuthenticated && chain?.network) {
      fetchWebhooks();
    }
    if (!isOpen || !chain) {
      resetForm();
    }
  }, [isOpen, isAuthenticated, chain?.network, fetchWebhooks, chain]);

  const isBeforeUpgrade = notificationType === "before-upgrade";

  const handleAddWebhook = async () => {
    if (!url.trim() || !label.trim() || !notificationType) {
      toast.warning("Select a provider, trigger, and destination URL.");
      return;
    }
    if (isBeforeUpgrade && notifyBeforeMinutes == null) {
      toast.warning("Choose how long before the upgrade to notify.");
      return;
    }

    await addWebhook({
      url,
      label,
      notificationType,
      notifyBeforeMinutes: isBeforeUpgrade ? notifyBeforeMinutes : null,
    });

    resetForm();
  };

  const handleTestWebhook = async () => {
    if (!url.trim() || !label.trim()) {
      toast.warning("Select a provider and destination URL first.");
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch("/api/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, url }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "Webhook test failed.");
      }

      toast.success("Webhook test events sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Webhook test failed.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const badgeProps = chain ? getBadgeProps(chain) : null;
  const {
    text: statusBadgeText,
    variant: statusBadgeVariant,
    Icon: StatusBadgeIcon,
    link: badgeLink,
  } = badgeProps || {};
  const logoUrl = chain?.logo_urls?.png || chain?.logo_urls?.svg;

  const StatusBadge = () => (
    <Badge variant={statusBadgeVariant} className="flex items-center gap-1">
      {StatusBadgeIcon && <StatusBadgeIcon className="h-4 w-4" />}
      {statusBadgeText}
    </Badge>
  );

  if (!chain) return null;

  const addDisabled =
    isLoadingWebhooks ||
    !url ||
    !label ||
    !notificationType ||
    (isBeforeUpgrade && notifyBeforeMinutes == null);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="surface-card max-h-[calc(100vh-3rem)] overflow-y-auto border-white/10 p-0 sm:max-w-[620px]">
        <DialogHeader className="border-b border-white/10 px-5 py-4">
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
            {logoUrl ? (
              badgeLink ? (
                <a
                  href={badgeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline"
                >
                  <Image
                    src={logoUrl}
                    alt={`${chain.network} logo`}
                    width={30}
                    height={30}
                    className="rounded-full"
                  />
                </a>
              ) : (
                <Image
                  src={logoUrl}
                  alt={`${chain.network} logo`}
                  width={30}
                  height={30}
                  className="rounded-full"
                />
              )
            ) : (
              <div className="h-8 w-8 rounded-full bg-white/10" />
            )}
            <span className="capitalize">{chain.network}</span>
            <Badge
              variant="outline"
              className={
                chain.type === "mainnet"
                  ? "border-blue-400/35 bg-blue-500/10 text-blue-200"
                  : "border-amber-400/35 bg-amber-500/10 text-amber-200"
              }
            >
              {chain.type}
            </Badge>
            {badgeLink ? (
              <a
                href={badgeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline"
              >
                <StatusBadge />
              </a>
            ) : (
              <StatusBadge />
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Upgrade details and notification settings for {chain.network}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-5 pb-5 pt-1">
          <div className="grid gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-3">
            <ChainMeta
              icon={<BellRing className="h-4 w-4" />}
              label="Upgrade"
              value={chain.upgrade_name || "unknown"}
            />
            <ChainMeta
              icon={<CalendarClock className="h-4 w-4" />}
              label="Height"
              value={chain.upgrade_block_height?.toLocaleString() || "unknown"}
            />
            <ChainMeta
              icon={<ExternalLink className="h-4 w-4" />}
              label="Source"
              value={chain.source.replace(/_/g, " ") || "unknown"}
            />
          </div>

          {isLoadingUser ? (
            <p className="py-4 text-center text-sm italic text-muted-foreground">
              Loading account state...
            </p>
          ) : isAuthenticated ? (
            <>
              <div>
                <h3 className="text-sm font-semibold">Upgrade webhooks</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Send Discord, Slack, or Telegram notifications for this chain.
                  Stack as many webhooks as you like (for example a week, a day,
                  and an hour before).
                </p>
              </div>

              {userError && (
                <p className="rounded-md border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200">
                  Error loading user data: {userError.message}
                </p>
              )}

              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-[150px_1fr_auto]">
                  <Select value={label} onValueChange={setLabel}>
                    <SelectTrigger aria-label="Provider">
                      <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discord">
                        <span className="flex items-center gap-2">
                          <DiscordIcon size={16} /> Discord
                        </span>
                      </SelectItem>
                      <SelectItem value="slack">
                        <span className="flex items-center gap-2">
                          <SlackIcon size={16} /> Slack
                        </span>
                      </SelectItem>
                      <SelectItem value="telegram">
                        <span className="flex items-center gap-2">
                          <Send className="h-4 w-4" /> Telegram
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddWebhook();
                    }}
                    aria-label="Webhook URL"
                    disabled={!isAuthenticated || !chain.network}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestWebhook}
                    disabled={isTesting || !url || !label}
                    className="gap-2"
                  >
                    <TestTube2 className="h-4 w-4" />
                    {isTesting ? "Testing" : "Test"}
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Select
                    value={notificationType}
                    onValueChange={setNotificationType}
                  >
                    <SelectTrigger aria-label="Notification trigger">
                      <SelectValue placeholder="Notification trigger" />
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
                  {isBeforeUpgrade && (
                    <LeadTimePicker
                      value={notifyBeforeMinutes}
                      onChange={setNotifyBeforeMinutes}
                    />
                  )}
                </div>

                {isBeforeUpgrade && (
                  <p className="text-xs text-muted-foreground">
                    If the upgrade is already nearer than your lead time, you
                    will be notified on the next check.
                  </p>
                )}

                <Button
                  onClick={handleAddWebhook}
                  aria-label="Add webhook"
                  className="w-full gap-2"
                  disabled={addDisabled}
                >
                  {isLoadingWebhooks && webhooks.length > 0
                    ? "Saving..."
                    : "Add webhook"}
                  <PlusIcon className="h-4 w-4" />
                </Button>

                {webhookError && (
                  <p className="rounded-md border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200">
                    Error managing webhooks: {webhookError.message}
                  </p>
                )}

                {isLoadingWebhooks && webhooks.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground">
                    Loading webhooks...
                  </p>
                ) : webhooks.length > 0 ? (
                  <ul className="scrollbar-thin max-h-44 space-y-2 overflow-y-auto pt-1">
                    {webhooks.map((webhook) => (
                      <WebhookRow
                        key={webhook.id}
                        webhook={webhook}
                        onRemove={removeWebhook}
                        isRemoving={isLoadingWebhooks}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-md border border-dashed border-white/10 p-3 text-xs italic text-muted-foreground">
                    No webhooks added for this chain yet.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="py-4 text-center text-sm italic text-muted-foreground">
              Sign in to save notification destinations for this chain.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

function ChainMeta({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="truncate text-sm font-medium">{value}</div>
    </div>
  );
}
