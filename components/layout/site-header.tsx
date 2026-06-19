"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import { cn } from "@/lib/utils";
import SignInButton from "@/components/signin-button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NAV_ITEMS, isActivePath } from "@/components/layout/nav-config";

export function SiteHeader() {
  const pathname = usePathname();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const items = NAV_ITEMS.filter((item) => !item.authOnly || isAuthenticated);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <Image
              src="/bryanlabs-logo-transparent.png"
              alt="BryanLabs Logo"
              width={40}
              height={40}
              priority
              className="h-10 w-10"
            />
            <span className="text-2xl">
              <span className="bg-gradient-to-r from-[#60a5fa] to-[#8b5cf6] bg-clip-text font-bold text-transparent">
                Bryan
              </span>
              <span className="font-light text-[#e0e7ff]">Labs</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {items.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <SignInButton />
          </div>
          <MobileNav items={items} />
        </div>
      </div>
    </header>
  );
}
