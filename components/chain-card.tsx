import { ChainUpgradeStatus } from "@/types/chain";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { formatDateTime } from "@/utils/date";
import { useState, useEffect } from "react";
import Image from "next/image";

const formatNumber = (num: number | null | undefined) =>
  num ? num.toLocaleString() : "-";

export const ChainCard = ({ data }: { data: ChainUpgradeStatus }) => {
  const upgradeFound = data.upgrade_found;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const logoUrl = data.logo_urls?.png || data.logo_urls?.svg;

  // Determine the badge text and color based on the source and rpc_server
  let badgeText = "No Upgrade";
  let badgeVariant: "default" | "destructive" | "warning" = "destructive";
  let badgeLink: string | null = null;

  if (!data.rpc_server) {
    badgeText = "Unknown";
    badgeVariant = "warning";
  } else if (data.source === "current_upgrade_plan") {
    badgeText = "Planned";
    badgeVariant = "default";
  } else if (data.source === "active_upgrade_proposals") {
    badgeText = "In Voting";
    badgeVariant = "warning";
    badgeLink = data.explorer_url?.url || null; // Extract the `url` property
  }

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <a
              href={badgeLink || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline"
            >
              <Image
                src={logoUrl}
                alt={`${data.network} Logo`}
                width={40}
                height={40}
                className="rounded-full"
              />
            </a>
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full" />
          )}
          <CardTitle className="text-lg font-semibold capitalize">
            {data.network}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Upgrade Status:
          </span>
          {badgeLink ? (
            <a
              href={badgeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline"
            >
              <Badge variant={badgeVariant}>
                {badgeText === "Planned" && (
                  <CheckCircle className="mr-1 h-4 w-4" />
                )}
                {badgeText === "In Voting" && (
                  <Info className="mr-1 h-4 w-4" />
                )}
                {badgeText === "Unknown" && (
                  <AlertTriangle className="mr-1 h-4 w-4" />
                )}
                {badgeText}
              </Badge>
            </a>
          ) : (
            <Badge variant={badgeVariant}>
              {badgeText === "Planned" && <CheckCircle className="mr-1 h-4 w-4" />}
              {badgeText === "In Voting" && <Info className="mr-1 h-4 w-4" />}
              {badgeText === "Unknown" && <AlertTriangle className="mr-1 h-4 w-4" />}
              {badgeText}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <span className="text-muted-foreground">Latest Block:</span>
          <span className="text-right font-mono">
            {formatNumber(data.latest_block_height)}
          </span>

          {upgradeFound && (
            <>
              <span className="text-muted-foreground">Upgrade Height:</span>
              <span className="text-right font-mono">
                {formatNumber(data.upgrade_block_height)}
              </span>

              <span className="text-muted-foreground pt-4 col-span-2 text-sm">
                {isClient
                  ? `Est. Upgrade in ${formatDateTime(
                      data.estimated_upgrade_time
                    )}`
                  : "Est. Upgrade time calculating..."}
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
