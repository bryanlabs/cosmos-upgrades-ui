import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "swagger-ui-react/swagger-ui.css";
import "./globals.css";
import Providers from "./providers";
import Image from "next/image";
import SignInButton from "@/components/signin-button";
import Link from "next/link";
import { Toaster } from "sonner";
import { Database } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cosmos Upgrades | BryanLabs",
  description:
    "Cosmos upgrade coordination, countdowns, and validator notifications from BryanLabs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col app-shell`}
      >
        <Providers>
          <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-md">
            <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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

              <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
                <Link
                  href="/api-docs"
                  className="flex items-center gap-2 text-foreground transition-colors hover:text-primary"
                >
                  <Database className="h-4 w-4" />
                  API
                </Link>
              </nav>

              <div className="flex items-center gap-2">
                <SignInButton />
              </div>
            </div>
          </header>

          <main className="flex-grow">{children}</main>
          <Toaster richColors closeButton position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
