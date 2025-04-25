import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChainUpgradeStatus } from "@/types/chain";
import { formatDistanceToNowStrict } from "date-fns";
import { Badge } from "./ui/badge";
import { getBadgeProps } from "@/utils/badge";
import Image from "next/image";
import { LinkIcon, PlusIcon, TrashIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccount } from "graz";
import { toast } from "sonner";

interface ChainDetailDialogProps {
  chain: ChainUpgradeStatus | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const ChainDetailDialog = ({
  chain,
  isOpen,
  onOpenChange,
}: ChainDetailDialogProps) => {
  const [webhooks, setWebhooks] = useState<
    Array<{ url: string; label: string }>
  >([]);

  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookLabel, setNewWebhookLabel] = useState("");
  const { data: account } = useAccount();

  const logoUrl = chain?.logo_urls?.png || chain?.logo_urls?.svg;
  const badgeProps = chain ? getBadgeProps(chain) : null;
  const {
    text: statusBadgeText,
    variant: statusBadgeVariant,
    Icon: StatusBadgeIcon,
    link: badgeLink,
  } = badgeProps || {};

  const upgradeFound = chain?.upgrade_found;

  const StatusBadge = () => (
    <Badge variant={statusBadgeVariant} className="flex items-center gap-1">
      {StatusBadgeIcon && <StatusBadgeIcon className="h-4 w-4" />}
      {statusBadgeText}
    </Badge>
  );

  const formatTimestamp = (timestamp: string | null | undefined): string => {
    if (!timestamp) return "N/A";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return formatDistanceToNowStrict(date, { addSuffix: true });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  const handleAddWebhook = async () => {
    const trimmedUrl = newWebhookUrl.trim();
    const trimmedLabel = newWebhookLabel.trim();
    const walletAddress = account?.bech32Address;

    if (!trimmedLabel) {
      toast.error("Please select a webhook type (Discord or Slack).");
      return;
    }
    if (!trimmedUrl) {
      toast.error("Please enter a webhook URL.");
      return;
    }
    if (!trimmedUrl.startsWith("https://")) {
      toast.error("Webhook URL must start with https://");
      return;
    }
    if (!walletAddress) {
      toast.error("Wallet address not found. Please connect your wallet.");
      return;
    }

    const payload = {
      userId: walletAddress,
      chainId: chain?.network,
      label: trimmedLabel,
      url: trimmedUrl,
    };

    console.log("Sending payload:", payload);

    try {
      const response = await fetch(`/api/chain-links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Webhook added successfully!");
        setNewWebhookUrl("");
        setNewWebhookLabel("");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorData,
        });
        toast.error(
          `Failed to add webhook: ${
            errorData.message || response.statusText || "Unknown error"
          } (Status: ${response.status})`
        );
      }
    } catch (error: unknown) {
      console.error("Fetch Error:", error);
      if (error instanceof Error) {
        toast.error(`Error adding webhook: ${error.message}`);
      } else {
        toast.error("An unexpected error occurred while adding the webhook.");
      }
    }
  };

  const handleRemoveWebhook = (urlToRemove: string) => {
    setWebhooks((prev) =>
      prev.filter((webhook) => webhook.url !== urlToRemove)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
            <span className="capitalize">{chain?.network}</span>
            <Badge
              className={`capitalize text-xs px-2 py-0.5 border ${
                chain?.type === "mainnet"
                  ? "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-700"
                  : "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700"
              }`}
            >
              {chain?.type}
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
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Latest Block</p>
              <p className="text-sm font-mono">
                {chain?.latest_block_height?.toLocaleString() ?? "-"}
              </p>
            </div>
            {upgradeFound && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Upgrade Name</p>
                  <p className="text-sm font-mono">
                    {chain.upgrade_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chain Version</p>
                  <p className="text-sm font-mono">{chain.version || "N/A"}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">
                    Upgrade Height
                  </p>
                  <p className="text-sm font-mono">
                    {chain.upgrade_block_height?.toLocaleString() ?? "N/A"}
                  </p>
                </div>
              </>
            )}
          </div>
          {upgradeFound && chain.estimated_upgrade_time && (
            <p className="text-xs text-muted-foreground">
              Est. Upgrade: {formatTimestamp(chain.estimated_upgrade_time)}
            </p>
          )}
          <hr className="my-3" />
          <TooltipProvider delayDuration={100}>
            <div className="flex flex-col gap-2 text-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  {chain?.rpc_server ? (
                    <a
                      href={chain?.rpc_server}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center w-full min-w-0 gap-1.5 border rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50 transition-colors overflow-hidden"
                    >
                      <LinkIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{chain?.rpc_server}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      RPC N/A
                    </span>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>RPC Address</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  {chain?.rest_server ? (
                    <a
                      href={chain?.rest_server}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center w-full min-w-0 gap-1.5 border rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50 transition-colors overflow-hidden"
                    >
                      <LinkIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{chain?.rest_server}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Rest N/A
                    </span>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rest Address</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  {chain?.explorer_url?.url ? (
                    <a
                      href={chain?.explorer_url.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center w-full min-w-0 gap-1.5 border rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50 transition-colors overflow-hidden"
                    >
                      <LinkIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {chain?.explorer_url.url}
                      </span>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Explorer N/A
                    </span>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>Block Explorer</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          <hr className="my-3" />
          <h3 className="text-sm font-semibold mb-2">Webhooks</h3>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Select
                value={newWebhookLabel}
                onValueChange={setNewWebhookLabel}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discord">Discord</SelectItem>
                  <SelectItem value="slack">Slack</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="url"
                placeholder="Enter webhook URL (https://...)"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddWebhook();
                }}
                className="flex-grow"
              />
              <Button
                size="icon"
                onClick={handleAddWebhook}
                aria-label="Add webhook"
                className="flex-shrink-0"
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
            {webhooks.length > 0 ? (
              <ul className="space-y-2 pt-2 max-h-32 overflow-y-auto">
                {webhooks.map((webhook) => (
                  <li
                    key={webhook.url}
                    className="flex items-center justify-between gap-2 text-sm border rounded-md px-3 py-1.5 bg-muted/30"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-medium capitalize">
                        {webhook.label}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {webhook.url}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => handleRemoveWebhook(webhook.url)}
                      aria-label={`Remove webhook ${webhook.label}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic pt-1">
                No webhooks added yet.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
