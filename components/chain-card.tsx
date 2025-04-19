import { ChainUpgradeStatus } from "@/types/chain";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "@/components/ui/badge";
import { Link as LinkIcon, AlertTriangle, CheckCircle } from "lucide-react";
import { formatDateTime } from "@/utils/date";

const formatNumber = (num: number | null | undefined) =>
  num ? num.toLocaleString() : "-";

export const ChainCard = ({ data }: { data: ChainUpgradeStatus }) => {
  const upgradeFound = data.upgrade_found;

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold capitalize flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-muted-foreground" />
          {data.network}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Upgrade Planned:
          </span>
          <Badge variant={upgradeFound ? "default" : "destructive"}>
            {upgradeFound ? (
              <CheckCircle className="mr-1 h-4 w-4" />
            ) : (
              <AlertTriangle className="mr-1 h-4 w-4" />
            )}
            {upgradeFound ? "Yes" : "No"}
          </Badge>
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
                Est. Upgrade in {formatDateTime(data.estimated_upgrade_time)}
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
