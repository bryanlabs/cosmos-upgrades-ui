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
import { CosmovisorDialog } from "@/components/cosmovisor-dialog";
import { useCosmovisorInfo } from "@/hooks/useCosmosvisorInfo";
import { Search, Star } from "lucide-react";

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
  const [filterType, setFilterType] = useState<"all" | "upgraded">(
    "upgraded"
  );
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
  const [isCosmovisorDialogOpen, setIsCosmovisorDialogOpen] = useState(false);

  const handleCardClick = (chain: ChainUpgradeStatus) => {
    setSelectedChain(chain);
    setIsDialogOpen(true);
  };

  const handleCosmovisorOpen = (chain: ChainUpgradeStatus) => {
    setSelectedChain(chain);
    setIsCosmovisorDialogOpen(true);
  };

  const handleCosmovisorClose = () => {
    setIsCosmovisorDialogOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setSelectedChain(null);
  };

  const filteredAndSortedChains = useMemo(() => {
    const filtered = (allChains ?? [])
      .filter((chain) =>
        searchTerm.trim()
          ? [
              chain.network,
              chain.type,
              chain.version,
              chain.upgrade_name,
              chain.source,
            ]
              .filter(Boolean)
              .some((value) =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
              )
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
      return [...filtered].sort((a, b) => a.network.localeCompare(b.network));
    }

    if (sortBy === "time_asc") {
      return [...filtered].sort((a, b) => {
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

  const totalChains = allChains?.length ?? 0;

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive">
        Error loading upgrade data: {error.message}
      </div>
    );
  }

  const isLoading = isLoadingChains || (isConnected && isLoadingFavorites);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Upgrade tracker</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Search active upgrade signals, open a chain for notification setup, or
          star networks after signing in.
        </p>
      </div>

      <div className="control-surface rounded-lg p-3 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search chains, versions, sources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-9"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end">
            <Select
              value={filterType}
              onValueChange={(v) => setFilterType(v as "all" | "upgraded")}
              disabled={isLoadingChains}
            >
              <SelectTrigger className="h-10 w-full lg:w-[140px]">
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
              <SelectTrigger className="h-10 w-full lg:w-[145px]">
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
                onValueChange={(v) =>
                  setFavoriteFilter(v as "all" | "favorites")
                }
                disabled={isLoading}
              >
                <SelectTrigger className="h-10 w-full lg:w-[145px]">
                  <SelectValue placeholder="Watchlist" />
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
              <SelectTrigger className="h-10 w-full lg:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Sort: Default</SelectItem>
                <SelectItem value="time_asc">Sort: Upgrade Time</SelectItem>
                <SelectItem value="alpha_asc">Sort: Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Showing {filteredAndSortedChains.length} of {totalChains} chains
          </span>
          {isConnected ? (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-yellow-400" />
              {favoritesSet.size} watched
            </span>
          ) : (
            <span>Sign in to save a watchlist.</span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-[200px] w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                  onCosmovisorIconClick={handleCosmovisorOpen}
                />
              </div>
            ))}
          </div>
          {filteredAndSortedChains.length === 0 && (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
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

      {/* Cosmovisor Dialog */}
      {selectedChain && isCosmovisorDialogOpen && (
        <RenderCosmovisorDialog
          isOpen={isCosmovisorDialogOpen}
          onClose={handleCosmovisorClose}
          chain={selectedChain}
        />
      )}
    </div>
  );
};

// Helper component to ensure hook is called conditionally but correctly
const RenderCosmovisorDialog = ({
  isOpen,
  onClose,
  chain,
}: {
  isOpen: boolean;
  onClose: () => void;
  chain: ChainUpgradeStatus;
}) => {
  const cosmovisorInfo = useCosmovisorInfo(chain);
  const logoUrl = chain?.logo_urls?.png || chain?.logo_urls?.svg;

  return (
    <CosmovisorDialog
      isOpen={isOpen}
      onClose={onClose}
      cosmovisorInfo={cosmovisorInfo}
      estimatedUpgradeTime={chain.estimated_upgrade_time || undefined}
      upgradeFound={chain.upgrade_found}
      chainLogoUrl={logoUrl}
    />
  );
};
