import { toast } from "sonner";
import { Webhook } from "@/types/user";

export const getUserData = async (userAddress: string | undefined) => {
  if (!userAddress) {
    console.warn("getUserData called without userAddress.");
    return null;
  }
  try {
    const response = await fetch(`/api/users/${userAddress}`);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to fetch user data: ${response.status}. ${errorBody}`
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

export const fetchWebhooks = async (
  userId: number | undefined,
  chainNetwork: string | undefined
): Promise<Webhook[]> => {
  if (!userId || !chainNetwork) {
    return [];
  }
  try {
    const response = await fetch(
      `/api/webhooks?userId=${encodeURIComponent(
        userId
      )}&chainId=${encodeURIComponent(chainNetwork)}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch webhooks");
    }
    const data: Webhook[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    toast.error("Failed to load webhooks.");
    return [];
  }
};

export const handleAddWebhook = async ({
  userId,
  chainNetwork,
  url,
  label,
  notificationType,
  notifyBeforeUpgrade,
}: {
  userId: number;
  chainNetwork: string;
  url: string;
  label: string;
  notificationType: string;
  notifyBeforeUpgrade: string;
}) => {
  try {
    new URL(url);
  } catch {
    toast.error("Invalid URL format.");
    return;
  }

  try {
    const response = await fetch("/api/webhooks/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        chainId: chainNetwork,
        url,
        label,
        notificationType,
        notifyBeforeUpgrade,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to add webhook";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = `${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    toast.success("Webhook added successfully!");
  } catch (error: unknown) {
    console.error("Error adding webhook:", error);
    if (error instanceof Error) {
      toast.error(`Failed to add webhook: ${error.message}`);
    } else {
      toast.error("An unknown error occurred while adding the webhook.");
    }
  }
};

export const handleRemoveWebhook = async (webhookId: string) => {
  try {
    const response = await fetch(`/api/webhooks`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: webhookId }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to remove webhook";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = `${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    toast.success("Webhook removed successfully!");
  } catch (error: unknown) {
    console.error("Error removing webhook:", error);
    if (error instanceof Error) {
      toast.error(`Failed to remove webhook: ${error.message}`);
    } else {
      toast.error("An unknown error occurred while removing the webhook.");
    }
  }
};

export const parseUpgradeInfo = (info: unknown): unknown => {
  if (typeof info !== "string") return info;

  try {
    return JSON.parse(info);
  } catch {
    const fixed = fixMalformedJSON(info);
    try {
      return JSON.parse(fixed);
    } catch {
      return info;
    }
  }
};

const fixMalformedJSON = (str: string): string => {
  let fixed = str;

  // Fix unquoted URLs (only if the value is not already quoted)
  fixed = fixed.replace(
    /(:\s*)(https?:\/\/[^\s",}]+)/g,
    (_, prefix, url) => `${prefix}"${url}"`
  );

  // Remove double trailing quotes before } or ,
  fixed = fixed.replace(/""(?=\s*[},])/g, '"');

  return fixed;
};
