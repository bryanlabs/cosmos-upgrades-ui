import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ParsedPlanInfo } from "@/hooks/useCosmosvisorInfo";
import { useTimeRemaining } from "@/hooks/useTimeRemaining";
import Link from "next/link";
import Image from "next/image";

interface CosmovisorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cosmovisorInfo: ParsedPlanInfo | null;
  estimatedUpgradeTime?: string;
  upgradeFound?: boolean;
  chainLogoUrl?: string | null;
}

export const CosmovisorDialog = ({
  isOpen,
  onClose,
  cosmovisorInfo,
  estimatedUpgradeTime,
  upgradeFound,
  chainLogoUrl,
}: CosmovisorDialogProps) => {
  const timeRemaining = useTimeRemaining(estimatedUpgradeTime, upgradeFound);

  if (!cosmovisorInfo) return null;

  const binaries = cosmovisorInfo.parsedInfo?.binaries ?? {};
  const parseError = !cosmovisorInfo.parsedInfo?.binaries;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {chainLogoUrl && (
              <Image
                src={chainLogoUrl}
                alt={`${cosmovisorInfo.name} logo`}
                width={24}
                height={24}
                className="rounded-full"
              />
            )}
            <DialogTitle>
              Cosmovisor Upgrade Plan: {cosmovisorInfo.name}
            </DialogTitle>
          </div>
          <DialogDescription>
            Details for the upcoming upgrade plan detected via Cosmovisor.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-left font-medium">Name:</span>
            <span className="col-span-3 font-mono text-sm">
              {cosmovisorInfo.name}
            </span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-left font-medium">Height:</span>
            <span className="col-span-3 font-mono text-sm">
              {cosmovisorInfo.height}
            </span>
          </div>
          {timeRemaining && (
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-left font-medium">Time Left:</span>
              <span className="col-span-3 font-mono text-sm">
                {timeRemaining.days === 0 &&
                timeRemaining.hours === 0 &&
                timeRemaining.minutes === 0 &&
                timeRemaining.seconds === 0 ? (
                  "Upgrade time passed"
                ) : (
                  <>
                    {timeRemaining.days > 0 && `${timeRemaining.days}d `}
                    {timeRemaining.hours > 0 && `${timeRemaining.hours}h `}
                    {timeRemaining.minutes > 0 && `${timeRemaining.minutes}m `}
                    {`${timeRemaining.seconds}s`}
                  </>
                )}
              </span>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-left font-medium">Height:</span>
            <span className="col-span-3 font-mono text-sm">
              {cosmovisorInfo.height}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <span className="font-medium">Binaries:</span>
            <div className="col-span-3 flex flex-col gap-3">
              {Object.keys(binaries).length > 0 ? (
                Object.entries(binaries).map(([label, url]) => (
                  <Link
                    key={label}
                    href={url}
                    className="text-blue-600 hover:underline break-all flex gap-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image
                      src={
                        label.includes("darwin") ? "/apple.png" : "/linux.png"
                      }
                      alt={label}
                      width={20}
                      height={15}
                    />
                    {label}
                  </Link>
                ))
              ) : (
                <span className="text-sm text-gray-500">
                  No binaries specified in the plan.
                </span>
              )}
            </div>
            {parseError && (
              <p className="text-xs text-red-500">
                Error parsing binary details.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
