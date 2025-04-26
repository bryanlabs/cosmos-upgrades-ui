"use client";

import { useState, useEffect } from "react";
import { differenceInSeconds, intervalToDuration } from "date-fns";
import { cn } from "@/lib/utils";
// Import Tooltip components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface CountdownTimerProps {
  targetDate: string | null | undefined;
  // Add props for block heights
  upgradeBlockHeight: number | null;
  latestBlockHeight: number | null;
}

// Helper to format numbers with commas
const formatNumberWithCommas = (num: number | null | undefined) =>
  num ? num.toLocaleString() : "-";

const calculateTimeLeft = (target: Date | null) => {
  if (!target || isNaN(target.getTime())) {
    return null;
  }

  const now = new Date();
  const difference = differenceInSeconds(target, now);

  if (difference <= 0) {
    // Return 0s for passed state
    return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
  }

  const duration = intervalToDuration({ start: now, end: target });

  // Return numbers
  return {
    days: duration.days ?? 0,
    hours: duration.hours ?? 0,
    minutes: duration.minutes ?? 0,
    seconds: duration.seconds ?? 0,
    passed: false,
  };
};

export const CountdownTimer = ({
  targetDate,
  upgradeBlockHeight,
  latestBlockHeight,
}: CountdownTimerProps) => {
  const target = targetDate ? new Date(targetDate) : null;
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(target));

  useEffect(() => {
    if (!target || isNaN(target.getTime()) || timeLeft?.passed) {
      // No target date, invalid date, or time has passed, no need for interval
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(target));
    }, 1000);

    // Clear interval on component unmount or if time passes
    return () => clearInterval(timer);
  }, [target, timeLeft?.passed]); // Re-run effect if target changes or time passes

  if (!timeLeft) {
    return <span className="text-sm text-muted-foreground">Est. Upgrade: -</span>;
  }

  // Helper function to create styled segment
  const renderSegment = (value: number, label: string, isLast = false) => (
    <>
      <span className="text-lg font-bold text-foreground font-mono">{value}</span>
      <span className="text-sm text-muted-foreground font-sans">{label}</span>
      {!isLast && <span className="text-sm text-muted-foreground mx-1">:</span>}
    </>
  );

  const isLessThanOneHour = timeLeft.days === 0 && timeLeft.hours === 0;

  const renderCountdown = (passed = false) => (
    <div
      className={cn(
        "flex items-baseline",
        !passed && isLessThanOneHour && "animate-breathing"
      )}
    >
      {passed ? (
        <>
          {renderSegment(0, "d")}
          {renderSegment(0, "h")}
          {renderSegment(0, "m")}
          {renderSegment(0, "s", true)}
        </>
      ) : (
        <>
          {timeLeft.days > 0 && renderSegment(timeLeft.days, "d")}
          {renderSegment(timeLeft.hours, "h")}
          {renderSegment(timeLeft.minutes, "m")}
          {renderSegment(timeLeft.seconds, "s", true)}
        </>
      )}
    </div>
  );

  // Wrap the countdown in a tooltip
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>{renderCountdown(timeLeft.passed)}</TooltipTrigger>
        <TooltipContent side="top" align="center">
          <p className="text-xs text-muted-foreground">
            Upgrade at block:{" "}
            <span className="font-mono font-medium text-foreground">
              {formatNumberWithCommas(upgradeBlockHeight)}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Current block:{" "}
            <span className="font-mono font-medium text-foreground">
              {formatNumberWithCommas(latestBlockHeight)}
            </span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
