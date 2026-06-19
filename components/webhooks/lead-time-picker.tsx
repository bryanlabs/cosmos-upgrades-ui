"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NOTIFY_BEFORE_PRESETS,
  NOTIFY_BEFORE_MIN,
  NOTIFY_BEFORE_MAX,
} from "@/lib/webhook-delivery";

const CUSTOM = "custom";

const UNITS = [
  { value: "1", label: "minutes" },
  { value: "60", label: "hours" },
  { value: "1440", label: "days" },
  { value: "10080", label: "weeks" },
];

function computeCustom(amount: string, unitMinutes: string): number | null {
  const n = Number(amount);
  if (!Number.isInteger(n) || n <= 0) return null;
  const minutes = n * Number(unitMinutes);
  if (minutes < NOTIFY_BEFORE_MIN || minutes > NOTIFY_BEFORE_MAX) return null;
  return minutes;
}

// Lets a user pick a preset lead time or enter a custom amount + unit. Reports
// the resolved value to the parent as an integer number of minutes (or null
// when nothing valid is selected).
export function LeadTimePicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (minutes: number | null) => void;
}) {
  const [selection, setSelection] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("1440"); // default to days

  // Reset internal state when the parent clears the value (form reset / reopen).
  useEffect(() => {
    if (value == null) {
      setSelection("");
      setAmount("");
      return;
    }

    const preset = NOTIFY_BEFORE_PRESETS.find((item) => item.minutes === value);
    if (preset) {
      setSelection(String(value));
      setAmount("");
      return;
    }

    const matchingUnit =
      [...UNITS].reverse().find((item) => value % Number(item.value) === 0) ||
      UNITS[0];
    setSelection(CUSTOM);
    setUnit(matchingUnit.value);
    setAmount(String(value / Number(matchingUnit.value)));
  }, [value]);

  const handleSelection = (next: string) => {
    setSelection(next);
    onChange(next === CUSTOM ? computeCustom(amount, unit) : Number(next));
  };

  const handleAmount = (next: string) => {
    setAmount(next);
    onChange(computeCustom(next, unit));
  };

  const handleUnit = (next: string) => {
    setUnit(next);
    onChange(computeCustom(amount, next));
  };

  const customInvalid =
    selection === CUSTOM && amount !== "" && computeCustom(amount, unit) == null;

  return (
    <div className="space-y-2">
      <Select value={selection} onValueChange={handleSelection}>
        <SelectTrigger aria-label="Lead time">
          <SelectValue placeholder="Lead time" />
        </SelectTrigger>
        <SelectContent>
          {NOTIFY_BEFORE_PRESETS.map((preset) => (
            <SelectItem key={preset.minutes} value={String(preset.minutes)}>
              {preset.label}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM}>Custom…</SelectItem>
        </SelectContent>
      </Select>

      {selection === CUSTOM && (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Amount"
            value={amount}
            onChange={(e) => handleAmount(e.target.value)}
            aria-label="Custom lead time amount"
            aria-invalid={customInvalid}
          />
          <Select value={unit} onValueChange={handleUnit}>
            <SelectTrigger aria-label="Custom lead time unit" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {customInvalid && (
        <p className="text-xs text-destructive">
          Choose a lead time between 5 minutes and 30 days.
        </p>
      )}
    </div>
  );
}
