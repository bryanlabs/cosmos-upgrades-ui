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

export { formatDateTime };
