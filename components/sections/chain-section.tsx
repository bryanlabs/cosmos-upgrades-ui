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
import { ChainDetailDialog } from "@/components/chain-detail-dialog";

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
  const [favoriteFilter, setFavoriteFilter] = useState<"all" | "favorites">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"default" | "time_asc" | "alpha_asc">(
    "default"
  );
  const [favoriteChains, setFavoriteChains] = useState<string[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [updatingFavoriteChainId, setUpdatingFavoriteChainId] = useState<
    string | null
  >(null);

  // State for dialog
  const [selectedChain, setSelectedChain] = useState<ChainUpgradeStatus | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Handler to open dialog
  const handleCardClick = (chain: ChainUpgradeStatus) => {
    setSelectedChain(chain);
    setIsDialogOpen(true);
  };

  // Handler for dialog state change (needed by Radix Dialog)
  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    // Reset selected chain when dialog closes
    if (!open) {
      setSelectedChain(null);
    }
  };

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

    // Apply sorting based on sortBy state
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

        // Handle cases where one or both times are missing
        if (timeA === Infinity && timeB === Infinity) {
          // If both missing, sort alphabetically as fallback
          return a.network.localeCompare(b.network);
        }
        if (timeA === Infinity) return 1; // Chains without time go last
        if (timeB === Infinity) return -1; // Chains without time go last

        // Sort by time (soonest first)
        return timeA - timeB;
      });
    }

    // Default sort (no change from filtered order)
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

  const renderGridContent = (data: ChainUpgradeStatus[] | undefined) => (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data?.map((chain) => (
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
      {data?.length === 0 && (
        <div className="text-center text-muted-foreground col-span-full pt-4">
          No chains found matching your filters.
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
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-start sm:justify-between items-center">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto items-center">
          <Select
            value={filterType}
            onValueChange={(value: "all" | "upgraded") => setFilterType(value)}
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
            onValueChange={(value: "all" | "mainnet" | "testnet") =>
              setNetworkTypeFilter(value)
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
              onValueChange={(value: "all" | "favorites") =>
                setFavoriteFilter(value)
              }
              disabled={isLoadingChains || isLoadingFavorites}
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
            onValueChange={(value: "default" | "time_asc" | "alpha_asc") =>
              setSortBy(value)
            }
            disabled={isLoadingChains}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Sort: Default</SelectItem>
              <SelectItem value="time_asc">Sort: Upgrade Time</SelectItem>
              <SelectItem value="alpha_asc">Sort: Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-auto sm:max-w-xs">
          <Input
            type="search"
            placeholder="Search chains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            disabled={isLoadingChains}
          />
        </div>
      </div>
      {isLoading
        ? renderSkeletonGrid()
        : renderGridContent(filteredAndSortedChains)}
      <ChainDetailDialog
        chain={selectedChain}
        isOpen={isDialogOpen}
        onClose={() => handleOpenChange(false)}
      />
    </div>
  );
};
