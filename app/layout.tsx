import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import Providers from "./providers";

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
  description: "UI for tracking Cosmos blockchain upgrades",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Providers>
            <header className="bg-primary text-primary-foreground py-4">
              <div className="container mx-auto grid grid-cols-3 items-center px-4">
                <div className="flex items-center">
                  <Image
                    src="/images/bryanlabs-banner.png"
                    alt="BryanLabs Banner"
                    width={200}
                    height={50}
                    priority
                  />
                </div>
                <div></div> {/* Empty cell for spacing */}
                <div className="flex justify-end">
                  <Image
                    src="/images/cosmosupgrades.png"
                    alt="Cosmos Upgrades Logo"
                    width={150}
                    height={50}
                  />
                </div>
              </div>
            </header>
            <main className="container mx-auto px-4 py-8">{children}</main>
            <footer className="bg-secondary text-secondary-foreground py-4">
              <div className="container mx-auto flex items-center justify-center px-4">
                Developed by BryanLabs
              </div>
            </footer>
          </Providers>
        </body>
      </html>
    </>
  );
}
