"use client";

import { useState, useMemo } from "react";
import { useAllChainData } from "@/hooks/useChainData";
import { ChainCard } from "@/components/chain-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChainUpgradeStatus } from "@/types/chain";

export const ChainSection = () => {
  const { data: allChains, isLoading, error } = useAllChainData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "upgraded">("all");

  const filteredChains = useMemo(() => {
    return (allChains ?? [])
      .filter((chain) =>
        searchTerm
          ? chain.network.toLowerCase().includes(searchTerm.toLowerCase())
          : true
      )
      .filter((chain) =>
        filterType === "upgraded" ? chain.upgrade_found : true
      );
  }, [allChains, searchTerm, filterType]);

  if (error) {
    return (
      <div className="text-center text-red-500">
        Error loading data: {error.message}
      </div>
    );
  }

  const renderGridContent = (data: ChainUpgradeStatus[] | undefined) => (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data?.map((chain) => (
          <ChainCard key={chain.network} data={chain} />
        ))}
      </div>
      {data?.length === 0 && (
        <div className="text-center text-muted-foreground col-span-full pt-4">
          No chains found matching &quot;
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
    <div className="space-y-4">
      <div className="flex gap-2 justify-between">
        <Select
          value={filterType}
          onValueChange={(value: "all" | "upgraded") => setFilterType(value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Chains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chains</SelectItem>
            <SelectItem value="upgraded">Chains with Upgrades</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="text"
          placeholder="Search Chains..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
          disabled={isLoading}
        />
      </div>
      {isLoading ? renderSkeletonGrid() : renderGridContent(filteredChains)}
    </div>
  );
};
