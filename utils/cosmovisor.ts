import { ParsedPlanInfo } from "@/hooks/useCosmosvisorInfo";

export const isCosmovisorCompleted = (plan: ParsedPlanInfo): boolean => {
  const hasName = !!plan.name?.trim();
  const hasHeight = !!plan.height && plan.height !== "0";

  let hasValidBinaries = false;

  try {
    const info = plan.parsedInfo ? plan.parsedInfo : null;
    const binaries = info ? info.binaries : null;

    hasValidBinaries =
      binaries !== null &&
      typeof binaries === "object" &&
      Object.keys(binaries).length > 0 &&
      Object.values(binaries).every((url: unknown) => typeof url === "string");
  } catch {
    hasValidBinaries = false;
  }

  return hasName && hasHeight && hasValidBinaries;
};
