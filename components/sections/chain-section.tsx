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
import { ChainDetailDialog } from "@/components/chain-detail-dialog";
import { ChainUpgradeStatus } from "@/types/chain";
import { useFavoriteChains } from "@/hooks/useFavoriteChains";

export const ChainSection = () => {
  const {
    data: allChains,
    isLoading: isLoadingChains,
    error,
  } = useAllChainData();
  const {
    favoritesSet,
    isLoadingFavorites,
    updatingFavoriteChainId,
    handleToggleFavorite,
    isConnected,
  } = useFavoriteChains();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "upgraded">("all");
  const [networkTypeFilter, setNetworkTypeFilter] = useState<
    "all" | "mainnet" | "testnet"
  >("all");
  const [favoriteFilter, setFavoriteFilter] = useState<"all" | "favorites">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"default" | "time_asc" | "alpha_asc">(
    "default"
  );

  const [selectedChain, setSelectedChain] = useState<ChainUpgradeStatus | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCardClick = (chain: ChainUpgradeStatus) => {
    setSelectedChain(chain);
    setIsDialogOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setSelectedChain(null);
  };

  const filteredAndSortedChains = useMemo(() => {
    const filtered = (allChains ?? [])
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
      .filter((chain) =>
        favoriteFilter === "favorites"
          ? isConnected && favoritesSet.has(chain.network)
          : true
      );

    if (sortBy === "alpha_asc") {
      return filtered.sort((a, b) => a.network.localeCompare(b.network));
    }

    if (sortBy === "time_asc") {
      return filtered.sort((a, b) => {
        const timeA = a.estimated_upgrade_time
          ? new Date(a.estimated_upgrade_time).getTime()
          : Infinity;
        const timeB = b.estimated_upgrade_time
          ? new Date(b.estimated_upgrade_time).getTime()
          : Infinity;
        if (timeA === Infinity && timeB === Infinity)
          return a.network.localeCompare(b.network);
        if (timeA === Infinity) return 1;
        if (timeB === Infinity) return -1;
        return timeA - timeB;
      });
    }

    return filtered;
  }, [
    allChains,
    searchTerm,
    filterType,
    networkTypeFilter,
    favoritesSet,
    favoriteFilter,
    isConnected,
    sortBy,
  ]);

  if (error) {
    return (
      <div className="text-center text-red-500">
        Error loading data: {error.message}
      </div>
    );
  }

  const isLoading = isLoadingChains || (isConnected && isLoadingFavorites);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-start sm:justify-between items-center">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto items-center">
          <Select
            value={filterType}
            onValueChange={(v) => setFilterType(v as "all" | "upgraded")}
            disabled={isLoadingChains}
          >
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upgraded">Has Upgrade</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={networkTypeFilter}
            onValueChange={(v) =>
              setNetworkTypeFilter(v as "all" | "mainnet" | "testnet")
            }
            disabled={isLoadingChains}
          >
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="Network Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Networks</SelectItem>
              <SelectItem value="mainnet">Mainnet</SelectItem>
              <SelectItem value="testnet">Testnet</SelectItem>
            </SelectContent>
          </Select>

          {isConnected && (
            <Select
              value={favoriteFilter}
              onValueChange={(v) => setFavoriteFilter(v as "all" | "favorites")}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Favorites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                <SelectItem value="favorites">Favorites</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select
            value={sortBy}
            onValueChange={(v) =>
              setSortBy(v as "default" | "time_asc" | "alpha_asc")
            }
            disabled={isLoadingChains}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Sort: Default</SelectItem>
              <SelectItem value="time_asc">Sort: Upgrade Time</SelectItem>
              <SelectItem value="alpha_asc">Sort: Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input
          placeholder="Search chain..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-[250px]"
          disabled={isLoading}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-[200px] w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedChains.map((chain) => (
              <div
                key={chain.network}
                onClick={() => handleCardClick(chain)}
                className="cursor-pointer"
              >
                <ChainCard
                  data={chain}
                  isFavorite={favoritesSet.has(chain.network)}
                  onToggleFavorite={handleToggleFavorite}
                  isUpdatingFavorite={updatingFavoriteChainId === chain.network}
                  isConnected={isConnected}
                />
              </div>
            ))}
          </div>
          {filteredAndSortedChains.length === 0 && (
            <div className="text-center text-muted-foreground col-span-full pt-4">
              No chains found matching your filters.
            </div>
          )}
        </div>
      )}

      {/* Chain Detail Dialog */}
      <ChainDetailDialog
        isOpen={isDialogOpen}
        onClose={() => handleOpenChange(false)}
        chain={selectedChain}
      />
    </div>
  );
};
