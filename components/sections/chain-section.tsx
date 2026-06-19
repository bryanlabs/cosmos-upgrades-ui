"use client";

import { useEffect, useState, useMemo } from "react";
import { useAllChainData } from "@/hooks/useChainData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavoriteChains } from "@/hooks/useFavoriteChains";
import { ChainGrid } from "@/components/sections/chain-grid";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ChevronLeft, ChevronRight, Search, SearchX, Star } from "lucide-react";

const PAGE_SIZE = 24;

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
  const [filterType, setFilterType] = useState<"all" | "upgraded">("upgraded");
  const [networkTypeFilter, setNetworkTypeFilter] = useState<
    "all" | "mainnet" | "testnet"
  >("all");
  const [favoriteFilter, setFavoriteFilter] = useState<"all" | "favorites">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"default" | "time_asc" | "alpha_asc">(
    "default"
  );

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

  const [page, setPage] = useState(1);

  // Reset to the first page whenever the result set changes.
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterType, networkTypeFilter, favoriteFilter, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedChains.length / PAGE_SIZE)
  );
  const currentPage = Math.min(page, totalPages);
  const pageChains = useMemo(
    () =>
      filteredAndSortedChains.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [filteredAndSortedChains, currentPage]
  );

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
              aria-label="Search chains"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end">
            <Select
              value={filterType}
              onValueChange={(v) => setFilterType(v as "all" | "upgraded")}
              disabled={isLoadingChains}
            >
              <SelectTrigger className="h-10 w-full lg:w-[140px]" aria-label="Status filter">
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
              <SelectTrigger className="h-10 w-full lg:w-[145px]" aria-label="Network type filter">
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
                <SelectTrigger className="h-10 w-full lg:w-[145px]" aria-label="Watchlist filter">
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
              <SelectTrigger className="h-10 w-full lg:w-[180px]" aria-label="Sort order">
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
      ) : filteredAndSortedChains.length > 0 ? (
        <div className="space-y-5 pt-4">
          <ChainGrid
            chains={pageChains}
            favoritesSet={favoritesSet}
            updatingFavoriteChainId={updatingFavoriteChainId}
            onToggleFavorite={handleToggleFavorite}
            isConnected={isConnected}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<SearchX className="h-6 w-6" />}
          title="No chains found"
          description="No chains match your current search and filters."
        />
      )}
    </div>
  );
};
