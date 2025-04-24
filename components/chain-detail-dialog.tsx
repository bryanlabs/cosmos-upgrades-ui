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
import { LinkIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  if (!chain) {
    return null;
  }
  const logoUrl = chain.logo_urls?.png || chain.logo_urls?.svg;
  const badgeProps = getBadgeProps(chain);
  const {
    text: statusBadgeText,
    variant: statusBadgeVariant,
    Icon: StatusBadgeIcon,
    link: badgeLink,
  } = badgeProps;

  const upgradeFound = chain.upgrade_found;

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
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Latest Block</p>
              <p className="text-sm font-mono">
                {chain.latest_block_height?.toLocaleString() ?? "-"}
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
                  {chain.rpc_server ? (
                    <a
                      href={chain.rpc_server}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center w-full min-w-0 gap-1.5 border rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50 transition-colors overflow-hidden"
                    >
                      <LinkIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{chain.rpc_server}</span>
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
                  {chain.rest_server ? (
                    <a
                      href={chain.rest_server}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center w-full min-w-0 gap-1.5 border rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50 transition-colors overflow-hidden"
                    >
                      <LinkIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{chain.rest_server}</span>
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
                  {chain.explorer_url?.url ? (
                    <a
                      href={chain.explorer_url.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center w-full min-w-0 gap-1.5 border rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50 transition-colors overflow-hidden"
                    >
                      <LinkIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{chain.explorer_url.url}</span>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
