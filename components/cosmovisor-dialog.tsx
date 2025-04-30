import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ParsedPlanInfo } from "@/hooks/useCosmosvisorInfo";
import { useTimeRemaining } from "@/hooks/useTimeRemaining";

interface CosmovisorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cosmovisorInfo: ParsedPlanInfo | null;
  estimatedUpgradeTime?: string;
  upgradeFound?: boolean;
}

export const CosmovisorDialog = ({
  isOpen,
  onClose,
  cosmovisorInfo,
  estimatedUpgradeTime,
  upgradeFound,
}: CosmovisorDialogProps) => {
  const timeRemaining = useTimeRemaining(estimatedUpgradeTime, upgradeFound);

  if (!cosmovisorInfo) return null;

  const binaries = cosmovisorInfo.parsedInfo?.binaries ?? {};
  const parseError = !cosmovisorInfo.parsedInfo?.binaries;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Cosmovisor Upgrade Plan: {cosmovisorInfo.name}
          </DialogTitle>
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
          <div className="grid grid-cols-1 gap-2">
            <span className="font-medium">Binaries:</span>
            <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 max-h-60 overflow-y-auto">
              <code className="text-white text-sm">
                {JSON.stringify(binaries, null, 2)}
              </code>
            </pre>
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
