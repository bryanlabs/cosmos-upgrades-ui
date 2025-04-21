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
};

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
      variant: "default",
      Icon: CheckCircle,
      link: null,
    };
  }
  if (statusData.source === "active_upgrade_proposals") {
    return {
      text: "In Voting",
      variant: "secondary",
      Icon: Info,
      link: null,
    };
  }
  return {
    text: "No Upgrade",
    variant: "outline",
    link: null,
  };
};
