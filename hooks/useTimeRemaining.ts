import { useEffect, useState } from "react";
import { formatTimeRemaining } from "@/utils/date";

export const useTimeRemaining = (
  estimatedUpgradeTime?: string,
  upgradeFound?: boolean
) => {
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !estimatedUpgradeTime || !upgradeFound) {
      setTimeRemaining(null);
      return;
    }

    const targetDate = new Date(estimatedUpgradeTime);

    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeRemaining("Upgrade time passed");
        clearInterval(intervalId);
      } else {
        setTimeRemaining(formatTimeRemaining(difference));
      }
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [isClient, estimatedUpgradeTime, upgradeFound]);

  return timeRemaining;
};
