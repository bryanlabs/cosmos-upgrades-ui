import { ChainUpgradeStatus } from "@/types/chain";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkIcon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

import type React from "react";
import { formatDateTime } from "@/utils/date";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getBadgeProps } from "@/utils/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { ChainDetailDialog } from "./chain-detail-dialog";

const formatNumber = (num: number | null | undefined) =>
  num ? num.toString() : "-";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const chainId = data.network;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const logoUrl = data.logo_urls?.png || data.logo_urls?.svg;
  const badgeProps = getBadgeProps(data);
  const {
    text: statusBadgeText,
    variant: statusBadgeVariant,
    Icon: StatusBadgeIcon,
    link: badgeLink,
  } = badgeProps;
  const upgradeFound = data.upgrade_found;

  const StatusBadge = () => (
    <Badge variant={statusBadgeVariant} className="flex items-center gap-1">
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

  const handleCardClick = () => {
    setIsDialogOpen(true);
  };

  const handleHeightClick = (event: React.MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation();
  };

  return (
    <>
      <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
          <div
            className="flex items-center gap-2 min-w-0 cursor-pointer"
            onClick={handleCardClick}
          >
            {logoUrl ? (
              badgeLink ? (
                <a
                  href={badgeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
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
              <span onClick={handleHeightClick} className="inline-block">
                <p className="text-sm font-mono">
                  {formatNumber(data.latest_block_height)}
                </p>
              </span>
            </div>

            {upgradeFound && (
              <div>
                <p className="text-sm text-muted-foreground">Upgrade Height</p>
                <span onClick={handleHeightClick} className="inline-block">
                  <p className="text-sm font-mono">
                    {formatNumber(data.upgrade_block_height)}
                  </p>
                </span>
              </div>
            )}
          </div>

          {upgradeFound && (
            <p className="text-xs text-muted-foreground pt-1">
              {isClient
                ? `Est. Upgrade: ${formatDateTime(data.estimated_upgrade_time)}`
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
      <ChainDetailDialog
        chain={data}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
};
