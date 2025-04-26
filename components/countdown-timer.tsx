"use client";

import { useState, useEffect } from "react";
import { differenceInSeconds, intervalToDuration } from "date-fns";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetDate: string | null | undefined;
}

const calculateTimeLeft = (target: Date | null) => {
  if (!target || isNaN(target.getTime())) {
    return null;
  }

  const now = new Date();
  const difference = differenceInSeconds(target, now);

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
  }

  const duration = intervalToDuration({ start: now, end: target });

  return {
    days: duration.days ?? 0,
    hours: duration.hours ?? 0,
    minutes: duration.minutes ?? 0,
    seconds: duration.seconds ?? 0,
    passed: false,
  };
};

export const CountdownTimer = ({ targetDate }: CountdownTimerProps) => {
  const target = targetDate ? new Date(targetDate) : null;
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(target));

  useEffect(() => {
    if (!target || isNaN(target.getTime()) || timeLeft?.passed) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(target));
    }, 1000);

    return () => clearInterval(timer);
  }, [target, timeLeft?.passed]);

  if (!timeLeft) {
    return <span className="text-sm text-muted-foreground">Est. Upgrade: -</span>;
  }

  const renderSegment = (value: number, label: string, isLast = false) => (
    <>
      <span className="text-base font-bold text-foreground font-mono">{value}</span>
      <span className="text-xs text-gray-500 font-sans">{label}</span>
      {!isLast && <span className="text-xs text-gray-500 mx-1">:</span>}
    </>
  );

  const isLessThanOneHour = timeLeft.days === 0 && timeLeft.hours === 0;

  const renderCountdownDisplay = (passed = false) => (
    <div
      className={cn(
        "flex items-baseline",
        !passed && isLessThanOneHour && "animate-breathing"
      )}
    >
      {passed ? (
        <>
          {renderSegment(0, "d")}
          {renderSegment(0, "h", true)}
        </>
      ) : (
        <>
          {timeLeft.days > 0 && renderSegment(timeLeft.days, "d")}
          {renderSegment(timeLeft.hours, "h", true)}
          <span className="text-xs text-gray-400 ml-1">...</span>
        </>
      )}
    </div>
  );

  return renderCountdownDisplay(timeLeft.passed);
};
