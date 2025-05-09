import { ChainUpgradeStatus } from "@/types/chain";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkIcon, Star, Copy, Rocket, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

import React from "react";
import Image from "next/image";
import { getBadgeProps } from "@/utils/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useCosmovisorInfo } from "@/hooks/useCosmosvisorInfo";
import { useTimeRemaining } from "@/hooks/useTimeRemaining";
import { useCopy } from "@/hooks/useCopy";
import { networkLogos } from "@/constants/chain-mappings";
import { isCosmovisorCompleted } from "@/utils/cosmovisor";

interface ChainCardProps {
  data: ChainUpgradeStatus;
  isFavorite: boolean;
  isUpdatingFavorite: boolean;
  isConnected: boolean;
  onToggleFavorite: (chainId: string) => void;
  onCosmovisorIconClick: (chain: ChainUpgradeStatus) => void;
}

export const ChainCard = ({
  data,
  isFavorite,
  isUpdatingFavorite,
  isConnected,
  onToggleFavorite,
  onCosmovisorIconClick,
}: ChainCardProps) => {
  const {
    copied: copiedBlock,
    tooltipOpen: blockTooltipOpen,
    copy: copyBlock,
    handleTooltipOpenChange: handleBlockTooltipOpenChange,
  } = useCopy();

  const {
    copied: copiedUpgrade,
    tooltipOpen: upgradeTooltipOpen,
    copy: copyUpgrade,
    handleTooltipOpenChange: handleUpgradeTooltipOpenChange,
  } = useCopy();

  const cosmovisorInfo = useCosmovisorInfo(data);
  const cosmovisorCompleted = cosmovisorInfo
    ? isCosmovisorCompleted(cosmovisorInfo)
    : false;
  const timeRemaining = useTimeRemaining(
    data.estimated_upgrade_time || undefined,
    data.upgrade_found
  );

  const chainId = data.network;

  let displayLogoUrl: string | undefined = networkLogos[data.network];

  if (!displayLogoUrl) {
    const originalLogo = data.logo_urls?.png || data.logo_urls?.svg;
    displayLogoUrl = originalLogo ?? undefined;
  }

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
          {displayLogoUrl ? (
            badgeLink ? (
              <a
                href={badgeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline flex-shrink-0"
              >
                <Image
                  src={displayLogoUrl}
                  alt={`${data.network} Logo`}
                  width={28}
                  height={28}
                  className="rounded-full flex-shrink-0"
                />
              </a>
            ) : (
              <Image
                src={displayLogoUrl}
                alt={`${data.network} Logo`}
                width={28}
                height={28}
                className="rounded-full flex-shrink-0"
              />
            )
          ) : (
            <div className="w-7 h-7 bg-gray-300 rounded-full flex-shrink-0" />
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <CardTitle className="text-lg font-semibold capitalize truncate">
                {data.network.length > 9
                  ? `${data.network.slice(0, 9)}...`
                  : data.network}
              </CardTitle>
              {cosmovisorInfo && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onCosmovisorIconClick(data);
                  }}
                  className="cursor-pointer"
                >
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Rocket
                          className={`h-4 w-4 ${
                            cosmovisorCompleted
                              ? "text-green-400"
                              : "text-yellow-400"
                          } flex-shrink-0 transition-transform duration-150 ease-in-out hover:scale-110`}
                        />
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="center"
                        className="border shadow-md rounded-md p-2 max-w-xs text-xs"
                      >
                        <p>Cosmovisor Support Available</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{data.version}</p>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          <Badge
            className={`capitalize text-xs px-2 py-0.5 border ${
              data.type === "mainnet"
                ? "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-700"
                : "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700"
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
      <CardContent className="space-y-3 flex-grow">
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
                          copyBlock(data.latest_block_height);
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
                            copyUpgrade(data.upgrade_block_height);
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
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground pt-1">
              {timeRemaining ? (
                timeRemaining.days === 0 &&
                timeRemaining.hours === 0 &&
                timeRemaining.minutes === 0 &&
                timeRemaining.seconds === 0 ? (
                  "Upgrade time passed"
                ) : (
                  <>
                    <strong className="font-semibold text-sm text-black">
                      {timeRemaining.days}
                    </strong>
                    d{" "}
                    <strong className="font-semibold text-sm text-black">
                      {timeRemaining.hours}
                    </strong>
                    h{" "}
                    <strong className="font-semibold text-sm text-black">
                      {timeRemaining.minutes}
                    </strong>
                    m{" "}
                    <strong className="font-semibold text-sm text-black">
                      {timeRemaining.seconds}
                    </strong>
                    s
                  </>
                )
              ) : (
                "Calculating..."
              )}
            </p>
          </div>
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
            className="inline-flex items-center w-full min-w-0 gap-1.5 border rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted/50 transition-colors justify-center"
          >
            <LinkIcon className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {data.explorer_url.url.replace(/^(https?:\/\/)/, "")}
            </span>
          </a>
        </CardFooter>
      )}
    </Card>
  );
};
