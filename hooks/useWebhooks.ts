import { useState, useCallback } from "react";
import { Webhook } from "@/types/user";
import {
  fetchWebhooks as fetchWebhooksUtil,
  handleAddWebhook as handleAddWebhookUtil,
  handleRemoveWebhook as handleRemoveWebhookUtil,
} from "@/utils/chain-detail";

interface UseWebhooksProps {
  chainId: string | undefined;
  isAuthenticated: boolean;
}

interface AddWebhookPayload {
  url: string;
  label: string;
  notificationType: string;
  notifyBeforeMinutes: number | null;
}

export const useWebhooks = ({ chainId, isAuthenticated }: UseWebhooksProps) => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWebhooks = useCallback(async () => {
    if (!isAuthenticated || !chainId) {
      setWebhooks([]);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWebhooksUtil(chainId);
      setWebhooks(data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch webhooks")
      );
      setWebhooks([]); // Clear webhooks on error
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, chainId]);

  const addWebhook = useCallback(
    async (payload: AddWebhookPayload) => {
      if (!isAuthenticated || !chainId) {
        setError(new Error("Sign in and select a chain before adding webhooks."));
        return;
      }

      // Basic validation (the per-chain/per-user caps are enforced by the API).
      if (!payload.url || !payload.label || !payload.notificationType) {
        setError(new Error("Missing required webhook information.")); // Or use toast
        return;
      }

      setIsLoading(true); // Indicate loading during add operation
      setError(null);
      try {
        await handleAddWebhookUtil({
          chainNetwork: chainId,
          url: payload.url,
          label: payload.label,
          notificationType: payload.notificationType,
          notifyBeforeMinutes: payload.notifyBeforeMinutes,
        });
        await fetchWebhooks(); // Refetch after adding
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to add webhook")
        );
        // The util function likely shows a toast already
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, chainId, fetchWebhooks]
  );

  const removeWebhook = useCallback(
    async (webhookId: number) => {
      setIsLoading(true); // Indicate loading during remove operation
      setError(null);
      try {
        await handleRemoveWebhookUtil(webhookId);
        await fetchWebhooks(); // Refetch after removing
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to remove webhook")
        );
        // The util function likely shows a toast already
      } finally {
        setIsLoading(false);
      }
    },
    [fetchWebhooks]
  );

  return {
    webhooks,
    isLoading,
    error,
    fetchWebhooks,
    addWebhook,
    removeWebhook,
  };
};
