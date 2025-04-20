"use client";

import { useState } from "react";
import { useMainnetsData, useTestnetsData } from "@/hooks/useChainData";
import { ChainCard } from "@/components/chain-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChainUpgradeStatus } from "@/types/chain";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const ChainSection = () => {
  const {
    data: mainnetsData,
    isLoading: isLoadingMainnets,
    error: errorMainnets,
  } = useMainnetsData();
  const {
    data: testnetsData,
    isLoading: isLoadingTestnets,
    error: errorTestnets,
  } = useTestnetsData();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("mainnet");

  const isLoading = isLoadingMainnets || isLoadingTestnets;
  const error = errorMainnets || errorTestnets;

  const filterData = (data: ChainUpgradeStatus[] | undefined) =>
    data?.filter((chain) =>
      chain.network.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const filteredMainnets = filterData(mainnetsData);
  const filteredTestnets = filterData(testnetsData);

  if (error) {
    return (
      <div className="text-center text-red-500">
        Error loading data: {error.message}
      </div>
    );
  }

  const renderGridContent = (
    data: ChainUpgradeStatus[] | undefined,
    networkType: "Mainnet" | "Testnet"
  ) => (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data?.map((chain) => (
          <ChainCard key={chain.network} data={chain} />
        ))}
      </div>
      {data?.length === 0 && (
        <div className="text-center text-muted-foreground col-span-full pt-4">
          No {networkType.toLowerCase()} chains found matching &quot;
          {searchTerm}&quot;.
        </div>
      )}
    </div>
  );

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-[200px] w-full rounded-lg" />
      ))}
    </div>
  );

  return (
    <Tabs
      defaultValue="mainnet"
      className="space-y-4"
      onValueChange={setActiveTab}
      value={activeTab}
    >
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <TabsList>
          <TabsTrigger value="mainnet">Mainnets</TabsTrigger>
          <TabsTrigger value="testnet">Testnets</TabsTrigger>
        </TabsList>
        <Input
          type="text"
          placeholder={`Search ${
            activeTab === "mainnet" ? "Mainnet" : "Testnet"
          } Chains...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-2xl"
          disabled={isLoading}
        />
      </div>
      <TabsContent value="mainnet">
        {isLoading
          ? renderSkeletonGrid()
          : renderGridContent(filteredMainnets, "Mainnet")}
      </TabsContent>
      <TabsContent value="testnet">
        {isLoading
          ? renderSkeletonGrid()
          : renderGridContent(filteredTestnets, "Testnet")}
      </TabsContent>
    </Tabs>
  );
};
