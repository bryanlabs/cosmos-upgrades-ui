import { formatDistanceToNowStrict } from "date-fns";

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    const distance = formatDistanceToNowStrict(date, { addSuffix: true });
    return `${date.toLocaleString()} (${distance})`;
  } catch (e) {
    console.error("Error formatting date:", e);
    return "-";
  }
};

// Function to format remaining time in ms to D H M S format
const formatTimeRemaining = (milliseconds: number): string => {
  if (milliseconds <= 0) {
    return "0s";
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`); // Show seconds if other parts are zero or if it's the only unit

  return parts.join(" ");
};

export { formatDateTime, formatTimeRemaining };
