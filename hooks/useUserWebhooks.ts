import { useQuery } from "@tanstack/react-query";
import { Webhook } from "@/types/user";

async function fetchAllWebhooks(): Promise<Webhook[]> {
  const response = await fetch("/api/webhooks");
  if (response.status === 401) return [];
  if (!response.ok) {
    throw new Error("Failed to load alerts");
  }
  return response.json();
}

// Fetches every webhook the signed-in user has across all chains (the dashboard
// alerts view). Backed by GET /api/webhooks with no chainId.
export function useUserWebhooks(enabled: boolean) {
  return useQuery({
    queryKey: ["webhooks", "all"],
    queryFn: fetchAllWebhooks,
    enabled,
    staleTime: 30_000,
  });
}
