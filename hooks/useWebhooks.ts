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
  notifyBeforeUpgrade: string;
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

      // Basic validation (more robust validation happens in the util/API)
      if (webhooks.length >= 4) {
        setError(new Error("Maximum of 4 webhooks reached.")); // Or use toast
        return;
      }
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
          notifyBeforeUpgrade: payload.notifyBeforeUpgrade,
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
    [isAuthenticated, chainId, fetchWebhooks, webhooks.length]
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
