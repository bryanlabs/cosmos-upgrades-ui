// hooks/useFa.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount } from "graz";
import { toast } from "sonner";

export const useFavoriteChains = () => {
  const { isConnected, data: account } = useAccount();
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

  return {
    favoriteChains,
    favoritesSet,
    isLoadingFavorites,
    updatingFavoriteChainId,
    handleToggleFavorite,
    isConnected,
  };
};
