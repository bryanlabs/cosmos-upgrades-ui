"use client";

import { useState, useEffect } from "react";
import { differenceInSeconds, intervalToDuration } from "date-fns";

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

  if (timeLeft.passed) {
    return <span className="text-sm text-green-600 dark:text-green-400">Upgrade time passed</span>;
  }

  // Format the output string
  const parts = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
  if (timeLeft.hours > 0) parts.push(`${timeLeft.hours}h`);
  if (timeLeft.minutes > 0) parts.push(`${timeLeft.minutes}m`);
  // Always show seconds if less than a minute remaining or if it's the only unit left
  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0) {
      parts.push(`${timeLeft.seconds}s`);
  } else if (parts.length < 3) { // Show seconds if we have space (e.g., not showing days, hours, and minutes already)
      parts.push(`${timeLeft.seconds}s`);
  }


  const formattedTimeLeft = parts.join(" ");

  return (
    <span className="text-sm text-muted-foreground">
      Est. Upgrade: <span className="font-medium text-foreground">{formattedTimeLeft}</span>
    </span>
  );
};
