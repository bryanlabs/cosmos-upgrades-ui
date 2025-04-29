import { useEffect, useState } from "react";

// Define the return type for the hook
interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const useTimeRemaining = (
  estimatedUpgradeTime?: string,
  upgradeFound?: boolean
) => {
  // State to hold the time components or null
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(
    null
  );
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
    let intervalId: NodeJS.Timeout | null = null;

    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        // Set all components to 0 when time is up or passed
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (intervalId) clearInterval(intervalId);
      } else {
        // Calculate days, hours, minutes, seconds
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeRemaining({ days, hours, minutes, seconds });
      }
    };

    // Initial calculation
    updateCountdown();
    // Update every second
    intervalId = setInterval(updateCountdown, 1000);

    // Cleanup interval on unmount or dependency change
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isClient, estimatedUpgradeTime, upgradeFound]);

  // Return the object with time components
  return timeRemaining;
};
