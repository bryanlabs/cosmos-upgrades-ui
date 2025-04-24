import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) {
    return "";
  }
  const prefix = address.substring(0, chars + 2); // Include prefix like 'cosmos'
  const suffix = address.substring(address.length - chars);
  return `${prefix}...${suffix}`;
}
