import { ChainUpgradeStatus } from "@/types/chain";
import { useQuery, useQueries, UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";

// Assuming the API returns an array of ChainUpgradeStatus objects
type ChainDataResponse = ChainUpgradeStatus[];

const MAINNETS_URL = "/api/cosmos-upgrades/mainnets";
const TESTNETS_URL = "/api/cosmos-upgrades/testnets";

/**
 * Fetches data from a given URL and expects an array response.
 * @param url The URL to fetch data from.
 * @returns A promise that resolves to an array of ChainDataItem.
 */
const fetchChainData = async (url: string): Promise<ChainDataResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();

  // Assuming the API returns an array directly
  if (Array.isArray(result)) {
    return result as ChainDataResponse; // Type assertion
  } else {
    // Handle cases where the API might return an object containing the array
    // Example: if result is { data: [...] }
    console.warn("API response was not an array:", result);
    if (result && typeof result === "object" && Array.isArray(result.data)) {
      return result.data as ChainDataResponse; // Type assertion
    }
    // Or if the result itself is the object we need (less likely for a list endpoint)
    // else if (result && typeof result === 'object' && !Array.isArray(result)) {
    // Adapt this if the structure is different, e.g., Object.values(result)
    // For now, stick to expecting an array or { data: [...] }
    else {
      throw new Error("Unexpected API response format");
    }
  }
};

/**
 * Hook to fetch mainnet data using React Query.
 */
export function useMainnetsData() {
  return useQuery<ChainDataResponse, Error>({
    queryKey: ["mainnets"],
    queryFn: () => fetchChainData(MAINNETS_URL),
  });
}

/**
 * Hook to fetch testnet data using React Query.
 */
export function useTestnetsData() {
  return useQuery<ChainDataResponse, Error>({
    queryKey: ["testnets"],
    queryFn: () => fetchChainData(TESTNETS_URL),
  });
}

/**
 * Hook to fetch both mainnet and testnet data using React Query
 * and combine them.
 */
export function useAllChainData() {
  const results = useQueries<
    [
      UseQueryResult<ChainDataResponse, Error>,
      UseQueryResult<ChainDataResponse, Error>
    ]
  >({
    queries: [
      {
        queryKey: ["mainnets"],
        queryFn: () => fetchChainData(MAINNETS_URL),
      },
      {
        queryKey: ["testnets"],
        queryFn: () => fetchChainData(TESTNETS_URL),
      },
    ],
  });

  const [mainnetsResult, testnetsResult] = results;

  // Combine data using useMemo
  const allChains = useMemo(() => {
    const mainnets = mainnetsResult.data || [];
    const testnets = testnetsResult.data || [];
    return [...mainnets, ...testnets];
  }, [mainnetsResult.data, testnetsResult.data]);

  // Consolidate loading state
  const isLoading = mainnetsResult.isLoading || testnetsResult.isLoading;

  // Consolidate error state (return the first error encountered)
  const error = mainnetsResult.error || testnetsResult.error;

  return {
    data: allChains,
    isLoading,
    error,
  };
}
