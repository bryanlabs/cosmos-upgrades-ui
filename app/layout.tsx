import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Image from "next/image";
import SignInButton from "@/components/signin-button";
import Link from "next/link";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cosmos Upgrades UI",
  description: "Dashboard for tracking Cosmos chain upgrades",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Providers>
          {/* Header Section */}
          <header className="bg-black text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
              {/* Placeholder for Logo 1 */}
              <Link href="/">
                <Image
                  src="/cosmos-upgrades-text.png"
                  alt="Cosmos Upgrades Logo"
                  width={150}
                  height={24}
                  priority
                />
              </Link>
              <Link href="/">
                <Image
                  src="/bryanlabs_banner.png"
                  alt="Bryan Labs Banner"
                  width={200}
                  height={36}
                />
              </Link>
              <SignInButton />
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-grow">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
