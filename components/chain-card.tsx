import { memo } from "react";
import { ChainUpgradeStatus } from "@/types/chain";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarClock,
  Copy,
  Eye,
  ExternalLink,
  Gauge,
  LinkIcon,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

interface ChainCardProps {
  data: ChainUpgradeStatus;
  isFavorite: boolean;
  isUpdatingFavorite: boolean;
  isConnected: boolean;
  onToggleFavorite: (chainId: string) => void;
  onCosmovisorIconClick: (chain: ChainUpgradeStatus) => void;
  onSelect: (chain: ChainUpgradeStatus) => void;
}

const ChainCardComponent = ({
  data,
  isFavorite,
  isUpdatingFavorite,
  isConnected,
  onToggleFavorite,
  onCosmovisorIconClick,
  onSelect,
}: ChainCardProps) => {
  const blockCopy = useCopy();
  const upgradeCopy = useCopy();
  const cosmovisorInfo = useCosmovisorInfo(data);
  const cosmovisorCompleted = cosmovisorInfo
    ? isCosmovisorCompleted(cosmovisorInfo)
    : false;
  const timeRemaining = useTimeRemaining(
    data.estimated_upgrade_time || undefined,
    data.upgrade_found
  );

  const displayLogoUrl =
    networkLogos[data.network] ||
    data.logo_urls?.png ||
    data.logo_urls?.svg ||
    undefined;
  const badgeProps = getBadgeProps(data);
  const latestBlockHeight =
    typeof data.latest_block_height === "number" &&
    Number.isFinite(data.latest_block_height) &&
    data.latest_block_height >= 0
      ? data.latest_block_height
      : null;
  const upgradeBlockHeight =
    typeof data.upgrade_block_height === "number" &&
    Number.isFinite(data.upgrade_block_height) &&
    data.upgrade_block_height >= 0
      ? data.upgrade_block_height
      : null;
  const blockDelta =
    upgradeBlockHeight !== null && latestBlockHeight !== null
      ? upgradeBlockHeight - latestBlockHeight
      : null;
  const progress =
    data.upgrade_found &&
    upgradeBlockHeight !== null &&
    latestBlockHeight !== null &&
    upgradeBlockHeight > 0
      ? Math.min(
          100,
          Math.max(0, (latestBlockHeight / upgradeBlockHeight) * 100)
        )
      : 0;

  const handleWatchClick = () => {
    if (isConnected) onToggleFavorite(data.network);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Open ${formatChainName(data.network)} details`}
      onClick={() => onSelect(data)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(data);
        }
      }}
      className="surface-card group relative h-full cursor-pointer overflow-hidden rounded-lg py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-muted">
        <div
          className={cn(
            "h-full rounded-r-full transition-all duration-500",
            data.upgrade_found ? "bg-primary" : "bg-primary/60"
          )}
          style={{ width: `${data.upgrade_found ? progress : 100}%` }}
        />
      </div>

      <CardHeader className="flex flex-row items-start justify-between gap-3 px-4 pb-0 pt-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
            {displayLogoUrl ? (
              <Image
                src={displayLogoUrl}
                alt={`${data.network} logo`}
                width={44}
                height={44}
                className="h-10 w-10 rounded-full object-contain"
              />
            ) : (
              <Gauge className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-lg font-semibold capitalize leading-6 text-card-foreground">
                {formatChainName(data.network)}
              </h3>
              {cosmovisorInfo && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCosmovisorIconClick(data);
                        }}
                        className="rounded text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Open Cosmovisor upgrade plan"
                      >
                        <Rocket
                          className={cn(
                            "h-4 w-4",
                            cosmovisorCompleted ? "text-primary" : "text-violet-300"
                          )}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Cosmovisor plan available</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {data.version || "Version unknown"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge
            className={cn(
              "capitalize",
              data.type === "mainnet"
                ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                : "border-violet-500/30 bg-violet-500/10 text-violet-300"
            )}
            variant="outline"
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
                    handleWatchClick();
                  }}
                  className={cn(
                    "h-8 w-8 rounded-md border border-transparent",
                    isFavorite
                      ? "border-yellow-400/40 bg-yellow-400/15 text-yellow-300 shadow-[0_0_0_1px_rgba(250,204,21,0.12)] hover:bg-yellow-400/20 hover:text-yellow-200"
                      : "text-muted-foreground hover:bg-yellow-400/10 hover:text-yellow-300"
                  )}
                  aria-label={isFavorite ? "Unwatch chain" : "Watch chain"}
                  aria-pressed={isFavorite}
                >
                  <Eye
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isUpdatingFavorite
                        ? "animate-pulse text-muted-foreground"
                        : isFavorite
                          ? "text-yellow-300"
                          : "text-muted-foreground"
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {!isConnected
                  ? "Sign in to watch chains"
                  : isUpdatingFavorite
                    ? "Updating..."
                    : isFavorite
                      ? "Unwatch chain"
                      : "Watch chain"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 px-4 pb-2 pt-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            Upgrade status
          </span>
          <StatusBadge badgeProps={badgeProps} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric
            label="Latest block"
            value={latestBlockHeight}
            copy={blockCopy}
          />
          <Metric
            label="Upgrade height"
            value={upgradeBlockHeight}
            copy={upgradeCopy}
          />
        </div>

        {data.upgrade_found ? (
          <div className="rounded-lg border border-border/80 bg-background/35 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <CalendarClock className="h-4 w-4 text-primary" />
              {formatCountdown(timeRemaining)}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                {blockDelta !== null && blockDelta > 0
                  ? `${blockDelta.toLocaleString()} blocks away`
                  : "Height reached or unavailable"}
              </span>
              <span>{formatSource(data.source)}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/80 bg-background/35 p-3 text-sm text-muted-foreground">
            {formatNoUpgradeMessage(data)}
          </div>
        )}
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0">
        {data.explorer_url?.url ? (
          <a
            href={data.explorer_url.url}
            onClick={(e) => e.stopPropagation()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-2 rounded-md border border-border bg-background/30 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <LinkIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {data.explorer_url.url.replace(/^(https?:\/\/)/, "")}
            </span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        ) : (
          <div className="h-9 w-full rounded-md border border-dashed border-border" />
        )}
      </CardFooter>
    </Card>
  );
};

export const ChainCard = memo(ChainCardComponent);

const StatusBadge = ({
  badgeProps,
}: {
  badgeProps: ReturnType<typeof getBadgeProps>;
}) => {
  const { text, variant, Icon, link, className } = badgeProps;
  const badge = (
    <Badge
      variant={variant}
      className={cn(
        "flex items-center gap-1",
        className ||
          "border-border bg-secondary/70 text-secondary-foreground"
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {text}
    </Badge>
  );

  if (!link) return badge;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="no-underline"
      onClick={(event) => event.stopPropagation()}
    >
      {badge}
    </a>
  );
};

const Metric = ({
  label,
  value,
  copy,
}: {
  label: string;
  value: number | null | undefined;
  copy: ReturnType<typeof useCopy>;
}) => (
  <div className="min-w-0 rounded-lg border border-border/80 bg-background/35 p-3">
    <div className="mb-1 text-xs text-muted-foreground">{label}</div>
    {isMetricValue(value) ? (
      <TooltipProvider delayDuration={100}>
        <Tooltip
          open={copy.tooltipOpen}
          onOpenChange={copy.handleTooltipOpenChange}
        >
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                copy.copy(value);
              }}
              aria-label={`Copy ${label.toLowerCase()}`}
              className="flex min-w-0 items-center gap-1 rounded text-left font-mono text-sm text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="truncate">{value.toLocaleString()}</span>
              <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {copy.copied ? "Copied" : `Copy ${label.toLowerCase()}`}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      <div className="font-mono text-sm text-muted-foreground">-</div>
    )}
  </div>
);

function isMetricValue(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

const formatChainName = (network: string) =>
  network
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatCountdown = (
  timeRemaining: ReturnType<typeof useTimeRemaining>
) => {
  if (!timeRemaining) return "Calculating upgrade window";
  const { days, hours, minutes, seconds } = timeRemaining;
  if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
    return "Upgrade window reached";
  }
  const parts = [
    days > 0 ? `${days}d` : null,
    hours > 0 || days > 0 ? `${hours}h` : null,
    minutes > 0 || hours > 0 || days > 0 ? `${minutes}m` : null,
    `${seconds}s`,
  ].filter(Boolean);
  return parts.join(" ");
};

const formatNoUpgradeMessage = (data: ChainUpgradeStatus) => {
  if (!data.rpc_server || data.scan_status === "unreachable") {
    return "Latest scan could not reach a healthy RPC endpoint.";
  }
  if (!data.rest_server || data.scan_status === "partial") {
    return "Upgrade detection unavailable; no healthy REST endpoint responded.";
  }
  return "No scheduled upgrade detected in the latest scan.";
};

const formatSource = (source: string) =>
  source
    ? source.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : "Source unknown";
