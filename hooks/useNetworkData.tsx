import { ChainUpgradeStatus } from "@/types/network";
import { useQuery } from "@tanstack/react-query";

// Assuming the API returns an array of ChainUpgradeStatus objects
type NetworkDataResponse = ChainUpgradeStatus[];

const MAINNETS_URL = "/api/cosmos-upgrades/mainnets";
const TESTNETS_URL = "/api/cosmos-upgrades/testnets";

/**
 * Fetches data from a given URL and expects an array response.
 * @param url The URL to fetch data from.
 * @returns A promise that resolves to an array of NetworkDataItem.
 */
const fetchNetworkData = async (url: string): Promise<NetworkDataResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();

  // Assuming the API returns an array directly
  if (Array.isArray(result)) {
    return result as NetworkDataResponse; // Type assertion
  } else {
    // Handle cases where the API might return an object containing the array
    // Example: if result is { data: [...] }
    console.warn("API response was not an array:", result);
    if (result && typeof result === "object" && Array.isArray(result.data)) {
      return result.data as NetworkDataResponse; // Type assertion
    }
    // Or if the result itself is the object we need (less likely for a list endpoint)
    // else if (result && typeof result === 'object' && !Array.isArray(result)) {
    // Adapt this if the structure is different, e.g., Object.values(result)
    // For now, stick to expecting an array or { data: [...] }
    // }
    else {
      throw new Error("Unexpected API response format");
    }
  }
};

/**
 * Hook to fetch mainnet data using React Query.
 */
export function useMainnetsData() {
  return useQuery<NetworkDataResponse, Error>({
    queryKey: ["mainnets"],
    queryFn: () => fetchNetworkData(MAINNETS_URL),
  });
}

/**
 * Hook to fetch testnet data using React Query.
 */
export function useTestnetsData() {
  return useQuery<NetworkDataResponse, Error>({
    queryKey: ["testnets"],
    queryFn: () => fetchNetworkData(TESTNETS_URL),
  });
}
