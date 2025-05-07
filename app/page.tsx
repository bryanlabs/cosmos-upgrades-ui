"use client";

import { ChainSection } from "@/components/sections/chain-section";
import { useUserData } from "@/hooks/useUserData";

export default function Home() {
  useUserData();
  return (
    <div className="container mx-auto px-4 py-8">
      <ChainSection />
    </div>
  );
}
