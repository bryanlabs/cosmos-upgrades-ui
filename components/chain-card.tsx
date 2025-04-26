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
import { CountdownTimer } from "./countdown-timer";

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
        className="w-full shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col h-full rounded-xl bg-gradient-to-br from-card to-card/95 hover:-translate-y-0.5"
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
            <div className="flex flex-col overflow-hidden">
              <CardTitle className="text-xl font-bold capitalize truncate">
                {data.network}
              </CardTitle>
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
        </CardContent>
        <CardFooter className="flex flex-col items-start pt-2 pb-4 px-4 space-y-2">
          {cosmovisorInfo && (
            <div className="w-full">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant={
                        Object.keys(cosmovisorInfo.checksums).length > 0
                          ? "success"
                          : "warning"
                      }
                      className="flex items-center gap-1"
                    >
                      <Rocket className="h-3 w-3" />
                      Cosmovisor
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    className="bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800 shadow-md rounded-md p-2 max-w-xs text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="font-semibold mb-1">Plan: {cosmovisorInfo.name}</p>
                    {Object.keys(cosmovisorInfo.checksums).length > 0 ? (
                      <>
                        <p className="font-medium mt-1">Checksums:</p>
                        <ul className="list-disc list-inside">
                          {Object.entries(cosmovisorInfo.checksums).map(
                            ([platform, checksum]) => (
                              <li key={platform} className="font-mono text-muted-foreground">
                                {platform}: {checksum}
                              </li>
                            )
                          )}
                        </ul>
                      </>
                    ) : (
                      <p className="text-muted-foreground italic mt-1">
                        No checksums found in URLs
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          {upgradeFound && data.estimated_upgrade_time && (
            <div className="w-full">
              <CountdownTimer targetDate={data.estimated_upgrade_time} />
            </div>
          )}
          {upgradeFound && !data.estimated_upgrade_time && !cosmovisorInfo && (
            <div className="text-sm text-muted-foreground w-full">
              Est. Upgrade: -
            </div>
          )}
          {data.explorer_url?.url && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              asChild
            >
              <a
                href={data.explorer_url.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1.5"
              >
                <LinkIcon className="h-3 w-3 flex-shrink-0" />
                <span>Explorer</span>
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
