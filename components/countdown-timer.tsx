"use client";

import { useState, useEffect } from "react";
import { differenceInSeconds, intervalToDuration } from "date-fns";
import { TimeUnit } from "./time-unit";

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
    // Render 0s using the new style, with seconds
    return (
      <div className="flex space-x-4">
        <TimeUnit value={0} label="Days" />
        <TimeUnit value={0} label="Hours" />
        <TimeUnit value={0} label="Minutes" />
        <TimeUnit value={0} label="Seconds" /> {/* Added Seconds */}
      </div>
    );
  }

  // Render the time units with full labels, with seconds
  return (
    <div className="flex space-x-4">
      {/* Conditionally render days only if > 0 */}
      {timeLeft.days > 0 && <TimeUnit value={timeLeft.days} label="Days" />}
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <TimeUnit value={timeLeft.minutes} label="Minutes" />
      <TimeUnit value={timeLeft.seconds} label="Seconds" /> {/* Added Seconds */}
    </div>
  );
};
