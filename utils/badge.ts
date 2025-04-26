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

// Tailwind color classes for reference (similar to chain type badges)
// Yellow: bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700
// Green: bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700

export const getBadgeProps = (
  statusData: ChainUpgradeStatus
): ExtendedBadgeProps => {
  if (!statusData.rpc_server) {
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
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
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
