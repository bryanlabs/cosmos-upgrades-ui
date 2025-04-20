import { ChainUpgradeStatus } from "@/types/chain";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "@/components/ui/badge";

import type React from "react";
import { formatDateTime } from "@/utils/date";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getBadgeProps } from "@/utils/badge";

const formatNumber = (num: number | null | undefined) =>
  num ? num.toLocaleString() : "-";

export const ChainCard = ({ data }: { data: ChainUpgradeStatus }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const logoUrl = data.logo_urls?.png || data.logo_urls?.svg;

  const badgeProps = getBadgeProps(data);
  const {
    text: badgeText,
    variant: badgeVariant,
    Icon: BadgeIcon,
    link: badgeLink,
  } = badgeProps;
  const upgradeFound = data.upgrade_found;

  const StatusBadge = () => (
    <Badge variant={badgeVariant} className="flex items-center gap-1">
      {BadgeIcon && <BadgeIcon className="h-4 w-4" />}
      {badgeText}
    </Badge>
  );

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
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
                  width={32}
                  height={32}
                  className="rounded-full flex-shrink-0"
                />
              </a>
            ) : (
              <Image
                src={logoUrl}
                alt={`${data.network} Logo`}
                width={32}
                height={32}
                className="rounded-full flex-shrink-0"
              />
            )
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0" />
          )}
          <CardTitle className="text-lg font-semibold capitalize truncate">
            {data.network}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
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
            <p className="text-sm font-mono">
              {formatNumber(data.latest_block_height)}
            </p>
          </div>

          {upgradeFound && (
            <div>
              <p className="text-sm text-muted-foreground">Upgrade Height</p>
              <p className="text-sm font-mono">
                {formatNumber(data.upgrade_block_height)}
              </p>
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
    </Card>
  );
};
