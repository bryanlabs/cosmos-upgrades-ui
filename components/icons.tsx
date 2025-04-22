import {
  Github,
  LogOut,
  Moon,
  Sun,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
// You might need to find an appropriate Google icon package or use an SVG
// For simplicity, let's alias User for Google here
// import { SiGoogle } from "@icons-pack/react-simple-icons"; // Example if using simple-icons

export type Icon = LucideIcon;

export const Icons = {
  sun: Sun,
  moon: Moon,
  gitHub: Github,
  google: User, // TODO: Replace with actual Google icon (e.g., from react-icons or an SVG)
  wallet: Wallet,
  user: User,
  logOut: LogOut,
};
