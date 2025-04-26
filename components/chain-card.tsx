import { ChainUpgradeStatus } from "@/types/chain";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkIcon, Star, Rocket, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { getBadgeProps } from "@/utils/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { ChainDetailDialog } from "./chain-detail-dialog";
import { CountdownTimer } from "./countdown-timer";
import { cn } from "@/lib/utils";

const LOGO_SIZE = 32;

const formatNumber = (num: number | null | undefined) =>
  num ? num.toString() : "-";

// Helper function to extract sha256 checksums from URLs (simple example)
const extractChecksum = (url: string): string | null => {
  const match = url.match(/[?&_](?:sha256|checksum)=([a-f0-9]{64})/i);
  if (match && match[1]) {
    return match[1].substring(0, 8) + "...";
  }
  return null;
};

// Helper function to extract domain from URL
const extractDomain = (url: string | undefined): string => {
  if (!url) return "Explorer";
  try {
    const parsedUrl = new URL(url);
    // Remove www. if present
    return parsedUrl.hostname.replace(/^www\./, "");
  } catch (e) {
    console.error("Failed to parse URL for domain:", url, e);
    return "Explorer"; // Fallback
  }
};

interface ParsedPlanInfo {
  name: string;
  binaries: Record<string, string>;
  checksums: Record<string, string>;
}

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
  const [cosmovisorInfo, setCosmovisorInfo] = useState<ParsedPlanInfo | null>(
    null
  );
  const [isFlashing, setIsFlashing] = useState(false);
  const previousDataRef = useRef<ChainUpgradeStatus>();

  const chainId = data.network;

  useEffect(() => {
    setIsClient(true);

    if (
      data.upgrade_found &&
      data.source === "current_upgrade_plan" &&
      data.upgrade_plan
    ) {
      try {
        const parsedPlan = JSON.parse(data.upgrade_plan);
        if (parsedPlan && parsedPlan.info && typeof parsedPlan.info === "string") {
          try {
            const parsedInfo = JSON.parse(parsedPlan.info);
            if (
              parsedInfo &&
              parsedInfo.binaries &&
              typeof parsedInfo.binaries === "object" &&
              Object.keys(parsedInfo.binaries).length > 0
            ) {
              const checksums: Record<string, string> = {};
              for (const platform in parsedInfo.binaries) {
                const url = parsedInfo.binaries[platform];
                const checksum = extractChecksum(url);
                if (checksum) {
                  checksums[platform] = checksum;
                }
              }
              setCosmovisorInfo({
                name: parsedPlan.name || "N/A",
                binaries: parsedInfo.binaries,
                checksums: checksums,
              });
            } else {
              setCosmovisorInfo(null);
            }
          } catch (infoError) {
            console.error("Failed to parse plan.info JSON:", infoError);
            setCosmovisorInfo(null);
          }
        } else {
          setCosmovisorInfo(null);
        }
      } catch (planError) {
        console.error("Failed to parse upgrade_plan JSON:", planError);
        setCosmovisorInfo(null);
      }
    } else {
      setCosmovisorInfo(null);
    }
  }, [data.upgrade_found, data.source, data.upgrade_plan]);

  useEffect(() => {
    const previousSource = previousDataRef.current?.source;
    const currentSource = data.source;

    if (
      previousSource !== currentSource &&
      currentSource === "current_upgrade_plan"
    ) {
      setIsFlashing(true);
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 500);

      return () => clearTimeout(timer);
    }

    previousDataRef.current = data;
  }, [data]);

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

  const explorerBaseUrl = data.explorer_url?.url;

  return (
    <>
      <Card
        className={cn(
          "w-full shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col h-full rounded-xl bg-gradient-to-br from-card to-card/95 hover:-translate-y-0.5",
          isFlashing && "animate-flash"
        )}
      >
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
                    width={LOGO_SIZE}
                    height={LOGO_SIZE}
                    className="rounded-full flex-shrink-0"
                  />
                </a>
              ) : (
                <Image
                  src={logoUrl}
                  alt={`${data.network} Logo`}
                  width={LOGO_SIZE}
                  height={LOGO_SIZE}
                  className="rounded-full flex-shrink-0"
                />
              )
            ) : (
              <div
                className={`w-${LOGO_SIZE / 4} h-${LOGO_SIZE / 4} bg-gray-300 rounded-full flex-shrink-0`}
              />
            )}
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-xl font-bold capitalize truncate">
                  {data.network}
                </CardTitle>
                {cosmovisorInfo && (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Rocket className="h-4 w-4 text-blue-400 flex-shrink-0 transition-transform duration-150 ease-in-out hover:scale-110" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="center"
                        className="bg-background text-foreground border shadow-md rounded-md p-2 max-w-xs text-xs"
                      >
                        <p className="font-semibold">Cosmovisor Support Available</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {data.version && (
                <p className="text-xs font-mono text-foreground truncate">
                  {data.version}
                </p>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2">
            <Badge
              className={`capitalize text-xs px-2 py-0.5 border flex items-center gap-1 ${
                data.type === "mainnet"
                  ? "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-700"
                  : "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700"
              }`}
            >
              {data.type === "mainnet" && <Globe className="h-3 w-3" />}
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
              {explorerBaseUrl && data.latest_block_height ? (
                <a
                  href={`${explorerBaseUrl}/block/${data.latest_block_height}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-block text-sm font-mono text-foreground hover:underline"
                >
                  {formatNumber(data.latest_block_height)}
                </a>
              ) : (
                <p className="text-sm font-mono">
                  {formatNumber(data.latest_block_height)}
                </p>
              )}
            </div>

            {upgradeFound && (
              <div>
                <p className="text-sm text-muted-foreground">Upgrade Height</p>
                {explorerBaseUrl && data.upgrade_block_height ? (
                  <a
                    href={`${explorerBaseUrl}/block/${data.upgrade_block_height}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block text-sm font-mono text-foreground hover:underline"
                  >
                    {formatNumber(data.upgrade_block_height)}
                  </a>
                ) : (
                  <p className="text-sm font-mono">
                    {formatNumber(data.upgrade_block_height)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Combine Context Header and Countdown Timer */}
          {upgradeFound && data.estimated_upgrade_time && (
            <div className="mt-3 flex items-baseline gap-2">
              {/* Context Header - Remove Text */}
              <p className="text-sm text-muted-foreground">🗓️</p>
              {/* Countdown Timer */}
              <div className="w-auto">
                <CountdownTimer
                  targetDate={data.estimated_upgrade_time}
                />
              </div>
            </div>
          )}
          {/* Placeholder if no time and upgrade found */}
          {upgradeFound && !data.estimated_upgrade_time && (
            <div className="text-sm text-muted-foreground w-full mt-3">
              Est. Upgrade: -
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start pt-2 pb-4 px-4 space-y-2">
          {data.explorer_url?.url && (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a
                href={data.explorer_url.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1.5"
              >
                <LinkIcon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{extractDomain(data.explorer_url.url)}</span>
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
      <ChainDetailDialog
        chain={data}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
};
