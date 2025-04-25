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
import { useState, useEffect, useCallback } from "react";
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
import { DiscordIcon, SlackIcon } from "./icons/index";
import { User, Webhook } from "@/types/user";

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
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookLabel, setNewWebhookLabel] = useState("");
  const { data: account } = useAccount();
  const [userData, setUserData] = useState<User | null>(null);
  const userAddress = account?.bech32Address;
  const chainNetwork = chain?.network;

  const logoUrl = chain?.logo_urls?.png || chain?.logo_urls?.svg;
  const badgeProps = chain ? getBadgeProps(chain) : null;
  const {
    text: statusBadgeText,
    variant: statusBadgeVariant,
    Icon: StatusBadgeIcon,
    link: badgeLink,
  } = badgeProps || {};

  const upgradeFound = chain?.upgrade_found;

  const getUserData = useCallback(async () => {
    if (!userAddress) {
      console.warn("getUserData called without userAddress.");
      return null; // Or handle as appropriate
    }
    try {
      const response = await fetch(`/api/users/${userAddress}`);
      if (!response.ok) {
        // Handle HTTP errors (e.g., 404 Not Found, 500 Server Error)
        console.error(`API Error: ${response.status} ${response.statusText}`);
        // Attempt to read error message from response body if available
        const errorBody = await response.text(); // Use text() first to avoid JSON parse errors
        throw new Error(
          `Failed to fetch user data: ${response.status}. ${errorBody}`
        );
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Depending on how you want to handle errors upstream, you might re-throw or return null
      throw error; // Re-throwing for now
    }
  }, [userAddress]);

  const fetchWebhooks = useCallback(async () => {
    if (!isOpen || !userData?.id || !chainNetwork) {
      setWebhooks([]);
      return;
    }
    setIsLoadingWebhooks(true);
    try {
      const response = await fetch(
        `/api/webhooks?userId=${encodeURIComponent(
          userData.id
        )}&chainId=${encodeURIComponent(chainNetwork)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch webhooks");
      }
      const data: Webhook[] = await response.json();
      setWebhooks(data);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      toast.error("Failed to load webhooks.");
      setWebhooks([]);
    } finally {
      setIsLoadingWebhooks(false);
    }
  }, [isOpen, userData?.id, chainNetwork]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching user data for:", userAddress);
        const data = await getUserData();
        console.log("User data fetched:", data);
        setUserData(data);
      } catch (error) {
        console.error("Failed to fetch user data in useEffect:", error);
        // TODO: Handle error state in the UI
      }
    };
    if (userAddress) {
      // Only fetch if userAddress is available
      fetchData();
    }
  }, [getUserData, userAddress]); // Depend on userAddress instead of getUserData

  const handleAddWebhook = async () => {
    // Check if the webhook limit has been reached
    if (webhooks.length >= 4) {
      toast.warning("Maximum of 4 webhooks reached.");
      return;
    }

    // Ensure userData.id exists before proceeding
    if (!newWebhookUrl || !newWebhookLabel || !userData?.id || !chainNetwork) {
      toast.warning(
        "Please select a type, enter a valid webhook URL, and ensure user data is loaded."
      );
      return;
    }

    try {
      new URL(newWebhookUrl);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      toast.error("Invalid URL format.");
      return;
    }

    try {
      const response = await fetch("/api/webhooks/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userData.id,
          chainId: chainNetwork,
          url: newWebhookUrl,
          label: newWebhookLabel,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to add webhook";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_parseError) {
          errorMessage = `${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      toast.success("Webhook added successfully!");
      setNewWebhookUrl("");
      setNewWebhookLabel("");
      fetchWebhooks();
    } catch (error: unknown) {
      console.error("Error adding webhook:", error);
      if (error instanceof Error) {
        toast.error(`Failed to add webhook: ${error.message}`);
      } else {
        toast.error("An unknown error occurred while adding the webhook.");
      }
    }
  };

  const handleRemoveWebhook = async (webhookId: string) => {
    try {
      const response = await fetch(`/api/webhooks`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: webhookId }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to remove webhook";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_parseError) {
          errorMessage = `${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      toast.success("Webhook removed successfully!");
      fetchWebhooks();
    } catch (error: unknown) {
      console.error("Error removing webhook:", error);
      if (error instanceof Error) {
        toast.error(`Failed to remove webhook: ${error.message}`);
      } else {
        toast.error("An unknown error occurred while removing the webhook.");
      }
    }
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                    alt={`${chain?.network} Logo`}
                    width={28}
                    height={28}
                    className="rounded-full flex-shrink-0"
                  />
                </a>
              ) : (
                <Image
                  src={logoUrl}
                  alt={`${chain?.network} Logo`}
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
          {userAddress ? (
            <>
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
                      <SelectItem value="discord">
                        <DiscordIcon /> Discord
                      </SelectItem>
                      <SelectItem value="slack">
                        <SlackIcon />
                        Slack
                      </SelectItem>
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
                    disabled={!userAddress || !chainNetwork}
                  />
                  <Button
                    size="icon"
                    onClick={handleAddWebhook}
                    aria-label="Add webhook"
                    className="flex-shrink-0"
                    disabled={
                      !newWebhookUrl ||
                      !newWebhookLabel ||
                      !userAddress ||
                      !chainNetwork
                    }
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
                {isLoadingWebhooks ? (
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
                          <span className="text-xs text-muted-foreground truncate">
                            {webhook.url}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                          onClick={() => handleRemoveWebhook(webhook.id)}
                          aria-label={`Remove webhook ${webhook.label}`}
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
