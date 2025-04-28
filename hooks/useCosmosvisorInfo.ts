import { useState, useEffect } from "react";
import { ChainUpgradeStatus } from "@/types/chain";

// Helper function to extract sha256 checksums from URLs
const extractChecksum = (url: string): string | null => {
  const match = url.match(/[?&_](?:sha256|checksum)=([a-f0-9]{64})/i);
  if (match && match[1]) {
    return match[1].substring(0, 8) + "...";
  }
  return null;
};

export interface ParsedPlanInfo {
  name: string;
  binaries: Record<string, string>;
  checksums: Record<string, string>;
}

export const useCosmovisorInfo = (data: ChainUpgradeStatus) => {
  const [cosmovisorInfo, setCosmovisorInfo] = useState<ParsedPlanInfo | null>(
    null
  );

  useEffect(() => {
    if (
      data.upgrade_found &&
      data.source === "current_upgrade_plan" &&
      data.upgrade_plan
    ) {
      try {
        const parsedPlan = JSON.parse(data.upgrade_plan);
        if (parsedPlan?.info && typeof parsedPlan.info === "string") {
          try {
            const parsedInfo = JSON.parse(parsedPlan.info);
            if (
              parsedInfo?.binaries &&
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
                checksums,
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

  return cosmovisorInfo;
};
