import { ChainUpgradeStatus } from "@/types/chain";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkIcon, Star, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

import type React from "react";
import { formatTimeRemaining } from "@/utils/date";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getBadgeProps } from "@/utils/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface ChainCardProps {
  data: ChainUpgradeStatus;
  isFavorite: boolean;
  isUpdatingFavorite: boolean;
  isConnected: boolean;
  onToggleFavorite: (chainId: string) => void;
}

export const ChainCard = ({
  data,
  isFavorite,
  isUpdatingFavorite,
  isConnected,
  onToggleFavorite,
}: ChainCardProps) => {
  const [isClient, setIsClient] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [copiedBlock, setCopiedBlock] = useState(false);
  const [copiedUpgrade, setCopiedUpgrade] = useState(false);
  const [blockTooltipOpen, setBlockTooltipOpen] = useState(false);
  const [upgradeTooltipOpen, setUpgradeTooltipOpen] = useState(false);

  const chainId = data.network;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !data.estimated_upgrade_time || !data.upgrade_found) {
      setTimeRemaining(null);
      return;
    }

    const targetDate = new Date(data.estimated_upgrade_time);

    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeRemaining("Upgrade time passed");
        clearInterval(intervalId);
      } else {
        setTimeRemaining(formatTimeRemaining(difference));
      }
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [isClient, data.estimated_upgrade_time, data.upgrade_found]);

  const handleCopy = (
    text: string | number | null | undefined,
    type: "block" | "upgrade"
  ) => {
    if (!text) return;
    navigator.clipboard
      .writeText(text.toString())
      .then(() => {
        if (type === "block") {
          setCopiedBlock(true);
          setBlockTooltipOpen(true);
          setTimeout(() => {
            setCopiedBlock(false);
            setBlockTooltipOpen(false);
          }, 1000);
        } else {
          setCopiedUpgrade(true);
          setUpgradeTooltipOpen(true);
          setTimeout(() => {
            setCopiedUpgrade(false);
            setUpgradeTooltipOpen(false);
          }, 1000);
        }
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        if (type === "block") setBlockTooltipOpen(false);
        else setUpgradeTooltipOpen(false);
      });
  };

  const handleBlockTooltipOpenChange = (open: boolean) => {
    if (!open && copiedBlock) {
      return;
    }
    setBlockTooltipOpen(open);
  };

  const handleUpgradeTooltipOpenChange = (open: boolean) => {
    if (!open && copiedUpgrade) {
      return;
    }
    setUpgradeTooltipOpen(open);
  };

  const logoUrl = data.logo_urls?.png || data.logo_urls?.svg;
  const badgeProps = getBadgeProps(data);
  const {
    text: statusBadgeText,
    variant: statusBadgeVariant,
    Icon: StatusBadgeIcon,
    link: badgeLink,
    className: statusBadgeClassName,
  } = badgeProps;
  const upgradeFound = data.upgrade_found;

  const StatusBadge = () => (
    <Badge
      variant={statusBadgeVariant}
      className={`flex items-center gap-1 ${statusBadgeClassName || ""}`}
    >
      {StatusBadgeIcon && <StatusBadgeIcon className="h-4 w-4" />}
      {statusBadgeText}
    </Badge>
  );

  const handleStarClick = () => {
    if (isConnected) {
      onToggleFavorite(chainId);
    } else {
      console.log("Connect wallet to manage favorites");
    }
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
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
                  alt={`${data.network} Logo`}
                  width={28}
                  height={28}
                  className="rounded-full flex-shrink-0"
                />
              </a>
            ) : (
              <Image
                src={logoUrl}
                alt={`${data.network} Logo`}
                width={28}
                height={28}
                className="rounded-full flex-shrink-0"
              />
            )
          ) : (
            <div className="w-7 h-7 bg-gray-300 rounded-full flex-shrink-0" />
          )}
          <CardTitle className="text-lg font-semibold capitalize truncate">
            {data.network}
          </CardTitle>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          <Badge
            className={`capitalize text-xs px-2 py-0.5 border ${
              data.type === "mainnet"
                ? "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-700"
                : "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700"
            }`}
          >
            {data.type}
          </Badge>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStarClick();
                  }}
                  className="h-6 w-6 rounded-full"
                >
                  <Star
                    className={`h-4 w-4 ${
                      isUpdatingFavorite
                        ? "text-muted-foreground animate-pulse"
                        : isFavorite
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground hover:text-yellow-400"
                    } transition-colors`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {!isConnected ? (
                  <p>Connect wallet to manage favorites</p>
                ) : isUpdatingFavorite ? (
                  <p>Updating...</p>
                ) : (
                  <p>
                    {isFavorite ? "Remove from favorites" : "Add to favorites"}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-2 flex-grow">
        <div className="flex items-center justify-between flex-wrap">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            Upgrade Status:
          </span>
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
        </div>

        <div className="space-y-2 flex flex-wrap justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Latest Block</p>
            <div className="flex items-center gap-1">
              {data.latest_block_height ? (
                <TooltipProvider delayDuration={100}>
                  <Tooltip
                    open={blockTooltipOpen}
                    onOpenChange={handleBlockTooltipOpenChange}
                  >
                    <TooltipTrigger asChild>
                      <span
                        className="flex items-center gap-1 cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(data.latest_block_height, "block");
                        }}
                      >
                        <p className="text-sm font-mono">
                          {data.latest_block_height}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 text-muted-foreground group-hover:text-foreground"
                          aria-label="Copy block height"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs px-2 py-1">
                      {copiedBlock ? "Copied!" : "Copy block height"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <p className="text-sm font-mono">-</p>
              )}
            </div>
          </div>

          {upgradeFound && (
            <div>
              <p className="text-sm text-muted-foreground">Upgrade Height</p>
              <div className="flex items-center gap-1">
                {data.upgrade_block_height ? (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip
                      open={upgradeTooltipOpen}
                      onOpenChange={handleUpgradeTooltipOpenChange}
                    >
                      <TooltipTrigger asChild>
                        <span
                          className="flex items-center gap-1 cursor-pointer group"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(data.upgrade_block_height, "upgrade");
                          }}
                        >
                          <p className="text-sm font-mono">
                            {data.upgrade_block_height}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 text-muted-foreground group-hover:text-foreground"
                            aria-label="Copy upgrade height"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs px-2 py-1">
                        {copiedUpgrade ? "Copied!" : "Copy upgrade height"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <p className="text-sm font-mono">-</p>
                )}
              </div>
            </div>
          )}
        </div>

        {upgradeFound && (
          <p className="text-xs font-medium text-muted-foreground pt-1">
            {timeRemaining
              ? `Est. Upgrade in: ${timeRemaining}`
              : "Calculating..."}
          </p>
        )}
      </CardContent>

      {data.explorer_url?.url && (
        <CardFooter className="px-6">
          <a
            href={data.explorer_url.url}
            onClick={(e) => {
              e.stopPropagation();
            }}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center w-full min-w-0 gap-1.5 border rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <LinkIcon className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{data.explorer_url.url}</span>
          </a>
        </CardFooter>
      )}
    </Card>
  );
};
