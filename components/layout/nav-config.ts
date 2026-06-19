import { Database, Home, BellRing, type LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  // Only shown to signed-in users.
  authOnly?: boolean;
};

// Single source of truth for the primary navigation so the desktop header and
// the mobile drawer never drift apart.
export const NAV_ITEMS: NavItem[] = [
  { label: "Chains", href: "/", icon: Home },
  { label: "Alerts", href: "/dashboard", icon: BellRing, authOnly: true },
  { label: "API", href: "/api-docs", icon: Database },
];

export function isActivePath(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
