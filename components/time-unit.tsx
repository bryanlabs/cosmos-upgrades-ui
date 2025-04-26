import React from "react";
import { cn } from "@/lib/utils";

interface TimeUnitProps {
  value: number | string; // Accept number or string
  label: string;
  className?: string;
}

export const TimeUnit = ({ value, label, className }: TimeUnitProps) => {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Label */}
      <span className="text-xs text-muted-foreground uppercase mb-0.5">
        {label}
      </span>
      {/* Value */}
      <div className="text-lg font-semibold text-foreground font-mono">
        {/* Display value directly, assuming it's a number or already formatted string */}
        {value}
      </div>
    </div>
  );
};
