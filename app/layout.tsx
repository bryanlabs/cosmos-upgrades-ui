import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Image from "next/image";

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
        {/* Header Section */}
        <header className="bg-black text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            {/* Placeholder for Logo 1 */}
            <div>
              <Image
                src="/cosmosupgrades.webp"
                alt="Logo 1"
                width={70}
                height={70}
              />
            </div>
            {/* Placeholder for Logo 2 */}
            <div>
              <Image
                src="/bryanlabs_logo_trans.png"
                alt="Logo 2"
                width={70}
                height={70}
              />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}
