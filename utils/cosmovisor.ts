import { ParsedPlanInfo } from "@/hooks/useCosmosvisorInfo";

export const isCosmovisorCompleted = (plan: ParsedPlanInfo): boolean => {
  const hasName = !!plan.name?.trim();
  const hasHeight = !!plan.height && plan.height !== "0";

  let hasValidBinaries = false;

  try {
    const info = plan.info ? JSON.parse(plan.info) : {};
    const binaries = info.binaries;

    hasValidBinaries =
      binaries &&
      Object.values(binaries).every(
        (url: unknown) => typeof url === "string" && url.includes("checksum=")
      );
  } catch {
    hasValidBinaries = false;
  }

  return hasName && hasHeight && hasValidBinaries;
};
