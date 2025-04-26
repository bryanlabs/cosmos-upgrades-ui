import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import Image from "next/image"; // Import Image component
import { ThemeToggle } from "@/components/theme-toggle";
import { Github } from "lucide-react";

export const Header = () => {
  const { connectWallet, disconnectWallet, address, isConnected } = useWallet();

  const shortAddress = address
    ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    : "";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="mr-4 hidden md:flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            {/* <Icons.logo className="h-6 w-6" /> */}
            <span className="hidden font-bold sm:inline-block">
              Cosmos Upgrades
            </span>
          </a>
          {/* <nav className="flex items-center gap-6 text-sm">
            <a
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/docs"
            >
              Docs
            </a>
          </nav> */}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label="GitHub Repository"
          >
            <a
              href="https://github.com/bryanlabs/cosmos-upgrades"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
          <ThemeToggle />
          <Button
            onClick={isConnected ? disconnectWallet : connectWallet}
            variant="outline"
            size="sm" // Make button smaller
            className="flex items-center gap-2" // Add gap for icon
          >
            <Image // Add Keplr icon
              src="/icons/keplr-icon-monochrome-dark.png" // Adjust path if needed
              alt="Keplr"
              width={16} // Adjust size as needed
              height={16}
              className="dark:invert" // Invert colors in dark mode if needed
            />
            {isConnected ? `Disconnect ${shortAddress}` : "Connect Wallet"}
          </Button>
        </div>
      </div>
    </header>
  );
};
