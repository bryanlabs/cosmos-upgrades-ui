"use client";

import { useState } from "react";
import { useMainnetsData, useTestnetsData } from "@/hooks/useChainData";
import { ChainCard } from "@/components/chain-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChainUpgradeStatus } from "@/types/chain";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [filterByUpgrade, setFilterByUpgrade] = useState<"all" | "upgrades">(
    "all"
  );

  const isLoading = isLoadingMainnets || isLoadingTestnets;
  const error = errorMainnets || errorTestnets;

  const filterData = (data: ChainUpgradeStatus[] | undefined) =>
    data
      ?.filter((chain) =>
        filterByUpgrade === "upgrades" ? chain.upgrade_found : true
      )
      .filter((chain) =>
        chain.network.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const filteredData = [
    ...(filterData(mainnetsData) || []),
    ...(filterData(testnetsData) || []),
  ];

  const renderGridContent = (data: ChainUpgradeStatus[] | undefined) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
      {data?.map((chain) => (
        <ChainCard key={chain.network} data={chain} />
      ))}
    </div>
  );

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-[200px] w-full rounded-lg" />
      ))}
    </div>
  );

  if (error) {
    return (
      <div className="text-center text-red-500">
        Error loading data: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <Select
          value={filterByUpgrade}
          onValueChange={(value) =>
            setFilterByUpgrade(value as "all" | "upgrades")
          }
        >
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Filter by Upgrade Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chains</SelectItem>
            <SelectItem value="upgrades">Chains with Upgrades</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="text"
          placeholder="Search Chains..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-2xl"
          disabled={isLoading}
        />
      </div>
      {isLoading ? renderSkeletonGrid() : renderGridContent(filteredData)}
    </div>
  );
};
