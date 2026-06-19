import { Badge } from "@/components/ui/badge";
import { ChainUpgradeStatus } from "@/types/chain";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  type LucideIcon,
} from "lucide-react";

type ExtendedBadgeProps = {
  text: string;
  variant: React.ComponentProps<typeof Badge>["variant"];
  Icon?: LucideIcon;
  link?: string | null;
  className?: string;
};

export const getBadgeProps = (
  statusData: ChainUpgradeStatus
): ExtendedBadgeProps => {
  if (!statusData.rpc_server || statusData.scan_status === "partial") {
    return {
      text: "Unknown",
      variant: "secondary",
      Icon: AlertTriangle,
      link: null,
    };
  }
  if (statusData.source === "current_upgrade_plan") {
    return {
      text: "Planned",
      variant: "outline",
      Icon: CheckCircle,
      link: null,
      className:
        "border-primary/40 bg-primary/10 text-primary",
    };
  }
  if (statusData.source === "active_upgrade_proposals") {
    return {
      text: "In Voting",
      variant: "outline",
      Icon: Info,
      link: null,
      className:
        "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700",
    };
  }
  return {
    text: "No Upgrade",
    variant: "outline",
    link: null,
  };
};
