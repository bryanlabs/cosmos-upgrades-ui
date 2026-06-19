// hooks/useFa.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export const useFavoriteChains = () => {
  const { status } = useSession();
  const isConnected = status === "authenticated";
  const [favoriteChains, setFavoriteChains] = useState<string[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [updatingFavoriteChainId, setUpdatingFavoriteChainId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (status === "authenticated") {
        setIsLoadingFavorites(true);
        try {
          const response = await fetch("/api/me/favorites");
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
      } else if (status !== "loading") {
        setFavoriteChains([]);
        setIsLoadingFavorites(false);
      }
    };

    fetchFavorites();
  }, [status]);

  const favoritesSet = useMemo(() => new Set(favoriteChains), [favoriteChains]);

  const handleToggleFavorite = useCallback(
    async (chainId: string) => {
      if (!isConnected) {
        toast.info("Please sign in to watch chains.");
        return;
      }

      const isCurrentlyFavorite = favoritesSet.has(chainId);
      const method = isCurrentlyFavorite ? "DELETE" : "POST";
      const optimisticAction = isCurrentlyFavorite ? "Removing" : "Adding";
      const successAction = isCurrentlyFavorite ? "unwatched" : "watched";

      setUpdatingFavoriteChainId(chainId);

      try {
        const response = await fetch(
          "/api/me/favorites",
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
              `Failed to ${method === "POST" ? "watch" : "unwatch"} chain`
          );
        }

        setFavoriteChains(Array.isArray(result) ? result : []);
        toast.success(`${chainId} ${successAction}.`);
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
    [isConnected, favoritesSet]
  );

  return {
    favoriteChains,
    favoritesSet,
    isLoadingFavorites,
    updatingFavoriteChainId,
    handleToggleFavorite,
    isConnected,
  };
};
