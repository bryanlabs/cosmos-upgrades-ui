"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
import { useAccount } from "graz";
import { toast } from "sonner";

export const ChainSection = () => {
  const {
    data: allChains,
    isLoading: isLoadingChains,
    error,
  } = useAllChainData();
  const { isConnected, data: account } = useAccount();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "upgraded">("all");
  const [networkTypeFilter, setNetworkTypeFilter] = useState<
    "all" | "mainnet" | "testnet"
  >("all");
  const [favoriteChains, setFavoriteChains] = useState<string[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [updatingFavoriteChainId, setUpdatingFavoriteChainId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (isConnected && account?.bech32Address) {
        setIsLoadingFavorites(true);
        try {
          const response = await fetch(
            `/api/user/${account.bech32Address}/favorites`
          );
          if (!response.ok) {
            console.error("Failed to fetch favorites", await response.text());
            setFavoriteChains([]);
            return;
          }
          const favorites = await response.json();
          setFavoriteChains(Array.isArray(favorites) ? favorites : []);
        } catch (err) {
          console.error("Error fetching favorite chains:", err);
          setFavoriteChains([]);
        } finally {
          setIsLoadingFavorites(false);
        }
      } else {
        setFavoriteChains([]);
        setIsLoadingFavorites(false);
      }
    };

    fetchFavorites();
  }, [isConnected, account?.bech32Address]);

  const favoritesSet = useMemo(() => new Set(favoriteChains), [favoriteChains]);

  const handleToggleFavorite = useCallback(
    async (chainId: string) => {
      if (!isConnected || !account?.bech32Address) {
        toast.info("Please connect your wallet to manage favorites.");
        return;
      }

      const isCurrentlyFavorite = favoritesSet.has(chainId);
      const method = isCurrentlyFavorite ? "DELETE" : "POST";
      const optimisticAction = isCurrentlyFavorite ? "Removing" : "Adding";
      const successAction = isCurrentlyFavorite ? "removed from" : "added to";

      setUpdatingFavoriteChainId(chainId);

      try {
        const response = await fetch(
          `/api/user/${account.bech32Address}/favorites`,
          {
            method: method,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ chainId }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              `Failed to ${method === "POST" ? "add" : "remove"} favorite`
          );
        }

        setFavoriteChains(Array.isArray(result) ? result : []);
        toast.success(`${chainId} ${successAction} favorites!`);
      } catch (err) {
        console.error(`Error ${optimisticAction.toLowerCase()} favorite:`, err);
        toast.error(
          `Failed to ${method === "POST" ? "add" : "remove"} ${chainId}. ${
            err instanceof Error ? err.message : ""
          }`
        );
      } finally {
        setUpdatingFavoriteChainId(null);
      }
    },
    [isConnected, account?.bech32Address, favoritesSet]
  );

  const filteredAndSortedChains = useMemo(() => {
    const favoritesSet = new Set(favoriteChains);
    return (allChains ?? [])
      .filter((chain) =>
        searchTerm
          ? chain.network.toLowerCase().includes(searchTerm.toLowerCase())
          : true
      )
      .filter((chain) =>
        filterType === "upgraded" ? chain.upgrade_found : true
      )
      .filter((chain) =>
        networkTypeFilter === "all" ? true : chain.type === networkTypeFilter
      )
      .sort((a, b) => {
        const aIsFavorite = favoritesSet.has(a.network);
        const bIsFavorite = favoritesSet.has(b.network);
        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        return a.network.localeCompare(b.network);
      });
  }, [allChains, searchTerm, filterType, networkTypeFilter, favoritesSet]);

  if (error) {
    return (
      <div className="text-center text-red-500">
        Error loading data: {error.message}
      </div>
    );
  }

  const isLoading = isLoadingChains || (isConnected && isLoadingFavorites);

  const renderGridContent = (data: ChainUpgradeStatus[] | undefined) => (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data?.map((chain) => (
          <ChainCard
            key={chain.network}
            data={chain}
            isFavorite={favoritesSet.has(chain.network)}
            onToggleFavorite={handleToggleFavorite}
            isUpdatingFavorite={updatingFavoriteChainId === chain.network}
            isConnected={isConnected}
          />
        ))}
      </div>
      {data?.length === 0 && !isLoading && (
        <div className="text-center text-muted-foreground col-span-full pt-4">
          No chains found matching your criteria.
        </div>
      )}
    </div>
  );

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-[220px] w-full rounded-lg" />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-start sm:justify-between items-center">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
          <Select
            value={filterType}
            onValueChange={(value: "all" | "upgraded") => setFilterType(value)}
            disabled={isLoadingChains}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upgraded">Has Upgrade</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={networkTypeFilter}
            onValueChange={(value: "all" | "mainnet" | "testnet") =>
              setNetworkTypeFilter(value)
            }
            disabled={isLoadingChains}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Filter Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Networks</SelectItem>
              <SelectItem value="mainnet">Mainnet Only</SelectItem>
              <SelectItem value="testnet">Testnet Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          type="text"
          placeholder="Search Chains..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-auto sm:max-w-xs md:max-w-sm"
          disabled={isLoadingChains}
        />
      </div>
      {isLoading
        ? renderSkeletonGrid()
        : renderGridContent(filteredAndSortedChains)}
    </div>
  );
};
