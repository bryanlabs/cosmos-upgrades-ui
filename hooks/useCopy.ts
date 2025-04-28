// hooks/useCopy.ts
import { useState } from "react";

export const useCopy = () => {
  const [copied, setCopied] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const copy = async (text: string | number | null | undefined) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text.toString());
      setCopied(true);
      setTooltipOpen(true);
      setTimeout(() => {
        setCopied(false);
        setTooltipOpen(false);
      }, 1000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      setTooltipOpen(false);
    }
  };

  const handleTooltipOpenChange = (open: boolean) => {
    if (!open && copied) return;
    setTooltipOpen(open);
  };

  return {
    copied,
    tooltipOpen,
    copy,
    handleTooltipOpenChange,
  };
};
