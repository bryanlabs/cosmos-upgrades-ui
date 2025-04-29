"use client";

import { useEffect, useState } from "react";
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
import Image from "next/image";
import { PlusIcon, TrashIcon } from "lucide-react";
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

export const ChainDetailDialog = ({
  isOpen,
  onClose,
  chain,
}: ChainDetailDialogProps) => {
  const {
    userData,
    userAddress,
    isLoading: isLoadingUser,
    error: userError,
  } = useUserData();
  const userId = userData?.id;

  const {
    webhooks,
    isLoading: isLoadingWebhooks,
    error: webhookError,
    fetchWebhooks,
    addWebhook,
    removeWebhook,
  } = useWebhooks({
    userId,
    chainId: chain?.network,
  });

  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [notificationType, setNotificationType] = useState("");
  const [notifyBeforeUpgrade, setNotifyBeforeUpgrade] = useState("");

  useEffect(() => {
    if (isOpen && userId && chain?.network) {
      fetchWebhooks();
    }
    if (!isOpen || !chain) {
      setUrl("");
      setLabel("");
      setNotificationType("");
      setNotifyBeforeUpgrade("");
    }
  }, [isOpen, userId, chain?.network, fetchWebhooks, chain]);

  const handleAddWebhook = async () => {
    if (!url.trim() || !label.trim() || !notificationType) {
      toast.warning(
        "Please select a type, notification trigger, and enter a valid URL."
      );
      return;
    }
    if (notificationType === "before-upgrade" && !notifyBeforeUpgrade) {
      toast.warning("Please select how long before the upgrade to notify.");
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

  const handleRemoveWebhook = async (webhookId: string) => {
    await removeWebhook(webhookId);
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
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {logoUrl ? (
              badgeLink ? (
                <a
                  href={badgeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline flex-shrink-0"
                >
                  <Image
                    src={logoUrl}
                    alt={`${chain.network} Logo`}
                    width={28}
                    height={28}
                    className="rounded-full flex-shrink-0"
                  />
                </a>
              ) : (
                <Image
                  src={logoUrl}
                  alt={`${chain.network} Logo`}
                  width={28}
                  height={28}
                  className="rounded-full flex-shrink-0"
                />
              )
            ) : (
              <div className="w-7 h-7 bg-gray-300 rounded-full flex-shrink-0" />
            )}
            <span className="capitalize">{chain.network}</span>
            <Badge
              className={`capitalize text-xs px-2 py-0.5 border ${
                chain.type === "mainnet"
                  ? "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-700"
                  : "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700"
              }`}
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
        <div className="space-y-4 pt-4">
          {isLoadingUser ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              Loading user data...
            </p>
          ) : userAddress ? (
            <>
              <h3 className="text-sm font-semibold mb-2">
                Webhooks Notifications
              </h3>
              {userError && (
                <p className="text-sm text-red-500 italic">
                  Error loading user data: {userError.message}
                </p>
              )}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <Select value={label} onValueChange={setLabel}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discord">
                        <DiscordIcon /> Discord
                      </SelectItem>
                      <SelectItem value="slack">
                        <SlackIcon /> Slack
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="url"
                    placeholder="Enter webhook URL (https://...)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddWebhook();
                    }}
                    className="flex-grow"
                    disabled={!userAddress || !chain.network}
                  />
                </div>
                <Select
                  value={notificationType}
                  onValueChange={setNotificationType}
                >
                  <SelectTrigger className="w-full ">
                    <SelectValue placeholder="Choose when to be notified." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upgrade-proposed">
                      Upgrade Proposed
                    </SelectItem>
                    <SelectItem value="upgrade-planned">
                      Upgrade Planned
                    </SelectItem>
                    <SelectItem value="before-upgrade">
                      Notify Before Upgrade
                    </SelectItem>
                  </SelectContent>
                </Select>
                {notificationType === "before-upgrade" && (
                  <Select
                    value={notifyBeforeUpgrade}
                    onValueChange={setNotifyBeforeUpgrade}
                  >
                    <SelectTrigger className="w-full ">
                      <SelectValue placeholder="Choose how long before the upgrade to notify." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15m">15 Minutes</SelectItem>
                      <SelectItem value="60m">60 Minutes</SelectItem>
                      <SelectItem value="8h">8 Hours</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button
                  onClick={handleAddWebhook}
                  aria-label="Add webhook"
                  className="w-full flex items-center justify-center gap-1"
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
                    ? "Adding..."
                    : "Add Webhook"}
                  <PlusIcon className="h-4 w-4" />
                </Button>

                {process.env.NEXT_PUBLIC_IS_NOTIFICATION_READY !== "true" && (
                  <div>
                    <p className="text-sm italic text-red-500">
                      Notifications are not ready yet.
                    </p>
                  </div>
                )}

                {webhookError && (
                  <p className="text-sm text-red-500 italic">
                    Error managing webhooks: {webhookError.message}
                  </p>
                )}

                {isLoadingWebhooks && webhooks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic pt-1">
                    Loading webhooks...
                  </p>
                ) : webhooks.length > 0 ? (
                  <ul className="space-y-2 pt-2 max-h-32 overflow-y-auto">
                    {webhooks.map((webhook) => (
                      <li
                        key={webhook.id}
                        className="flex items-center justify-between gap-2 text-sm border rounded-md px-3 py-1.5 bg-muted/30"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-medium capitalize">
                            {webhook.label === "discord" ? (
                              <DiscordIcon size={16} />
                            ) : (
                              <SlackIcon size={16} />
                            )}
                          </span>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-xs text-muted-foreground truncate">
                              {webhook.url.replace(/^https?:\/\//, "")}
                            </span>
                            <span className="text-xs text-muted-foreground/80 capitalize">
                              Notifies on:{" "}
                              {webhook.notificationType.replace(/-/g, " ")}
                              {webhook.notificationType === "before-upgrade" &&
                                webhook.notifyBeforeUpgrade &&
                                ` (${webhook.notifyBeforeUpgrade})`}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                          onClick={() => handleRemoveWebhook(webhook.id)}
                          aria-label={`Remove webhook ${webhook.label}`}
                          disabled={isLoadingWebhooks}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic pt-1">
                    No webhooks added for this chain yet.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              Connect your wallet to manage webhooks.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
