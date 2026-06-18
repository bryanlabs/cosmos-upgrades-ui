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
  TrashIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
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
import { toast } from "sonner";

interface ChainDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chain: ChainUpgradeStatus | null;
}

const providerNames: Record<string, string> = {
  discord: "Discord",
  slack: "Slack",
  telegram: "Telegram",
};

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
  const [notifyBeforeUpgrade, setNotifyBeforeUpgrade] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen && isAuthenticated && chain?.network) {
      fetchWebhooks();
    }
    if (!isOpen || !chain) {
      setUrl("");
      setLabel("");
      setNotificationType("");
      setNotifyBeforeUpgrade("");
    }
  }, [isOpen, isAuthenticated, chain?.network, fetchWebhooks, chain]);

  const handleAddWebhook = async () => {
    if (!url.trim() || !label.trim() || !notificationType) {
      toast.warning("Select a provider, trigger, and destination URL.");
      return;
    }
    if (notificationType === "before-upgrade" && !notifyBeforeUpgrade) {
      toast.warning("Select how long before the upgrade to notify.");
      return;
    }

    await addWebhook({
      url,
      label,
      notificationType,
      notifyBeforeUpgrade:
        notificationType === "before-upgrade" ? notifyBeforeUpgrade : "",
    });

    setUrl("");
    setLabel("");
    setNotificationType("");
    setNotifyBeforeUpgrade("");
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

      toast.success("Test notification sent.");
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
                <h3 className="text-sm font-semibold">Webhook notifications</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Save Discord, Slack, or Telegram destinations for this chain.
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
                    <SelectTrigger>
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
                    <SelectTrigger>
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
                  {notificationType === "before-upgrade" && (
                    <Select
                      value={notifyBeforeUpgrade}
                      onValueChange={setNotifyBeforeUpgrade}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Lead time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15m">15 minutes</SelectItem>
                        <SelectItem value="60m">60 minutes</SelectItem>
                        <SelectItem value="8h">8 hours</SelectItem>
                        <SelectItem value="24h">24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Button
                  onClick={handleAddWebhook}
                  aria-label="Add webhook"
                  className="w-full gap-2"
                  disabled={
                    isLoadingWebhooks ||
                    !url ||
                    !label ||
                    !notificationType ||
                    (notificationType === "before-upgrade" &&
                      !notifyBeforeUpgrade)
                  }
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
                      <li
                        key={webhook.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                      >
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
                                  webhook.notifyBeforeUpgrade &&
                                  ` (${webhook.notifyBeforeUpgrade})`}
                              </span>
                            </div>
                            <span className="block max-w-[180px] truncate text-xs text-muted-foreground sm:max-w-[380px]">
                              {webhook.maskedUrl}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeWebhook(webhook.id)}
                          aria-label={`Remove ${webhook.label} webhook`}
                          disabled={isLoadingWebhooks}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </li>
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

function renderProviderIcon(label: string) {
  if (label === "discord") return <DiscordIcon size={16} />;
  if (label === "slack") return <SlackIcon size={16} />;
  return <Send className="h-4 w-4 text-muted-foreground" />;
}
