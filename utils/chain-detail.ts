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

export const getCurrentUserData = async () => {
  try {
    const response = await fetch("/api/users/me");
    if (response.status === 401) return null;
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to fetch current user data: ${response.status}. ${errorBody}`
      );
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching current user data:", error);
    throw error;
  }
};

export const fetchWebhooks = async (
  chainNetwork: string | undefined
): Promise<Webhook[]> => {
  if (!chainNetwork) {
    return [];
  }
  try {
    const response = await fetch(
      `/api/webhooks?chainId=${encodeURIComponent(chainNetwork)}`
    );
    if (response.status === 401) return [];
    if (!response.ok) {
      throw new Error("Failed to fetch webhooks");
    }
    const data: Webhook[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    toast.error("Failed to load webhooks.");
    throw error;
  }
};

export const handleAddWebhook = async ({
  chainNetwork,
  url,
  label,
  notificationType,
  notifyBeforeMinutes,
}: {
  chainNetwork: string;
  url: string;
  label: string;
  notificationType: string;
  notifyBeforeMinutes: number | null;
}) => {
  const nextUrl = url.trim();
  try {
    new URL(nextUrl);
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
        chainId: chainNetwork,
        url: nextUrl,
        label,
        notificationType,
        notifyBeforeMinutes,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to add webhook";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
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
      throw error;
    } else {
      toast.error("An unknown error occurred while adding the webhook.");
      throw new Error("An unknown error occurred while adding the webhook.");
    }
  }
};

export const handleRemoveWebhook = async (webhookId: number) => {
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
        errorMessage = errorData.error || errorData.message || errorMessage;
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
      throw error;
    } else {
      toast.error("An unknown error occurred while removing the webhook.");
      throw new Error("An unknown error occurred while removing the webhook.");
    }
  }
};

export const handleUpdateWebhook = async ({
  id,
  url,
  label,
  notificationType,
  notifyBeforeMinutes,
}: {
  id: number;
  url: string;
  label: string;
  notificationType: string;
  notifyBeforeMinutes: number | null;
}) => {
  const nextUrl = url.trim();
  if (nextUrl) {
    try {
      new URL(nextUrl);
    } catch {
      toast.error("Invalid URL format.");
      return;
    }
  }

  try {
    const response = await fetch("/api/webhooks", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        url: nextUrl,
        label,
        notificationType,
        notifyBeforeMinutes,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to update webhook";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = `${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    toast.success("Webhook updated successfully!");
  } catch (error: unknown) {
    console.error("Error updating webhook:", error);
    if (error instanceof Error) {
      toast.error(`Failed to update webhook: ${error.message}`);
      throw error;
    }
    toast.error("An unknown error occurred while updating the webhook.");
    throw new Error("An unknown error occurred while updating the webhook.");
  }
};

export const handleTestSavedWebhook = async (webhookId: number) => {
  try {
    const response = await fetch("/api/webhooks/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: webhookId, eventType: "all" }),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.error || "Webhook test failed.");
    }

    toast.success("Webhook test events sent.");
  } catch (error: unknown) {
    console.error("Error testing webhook:", error);
    if (error instanceof Error) {
      toast.error(`Webhook test failed: ${error.message}`);
      throw error;
    }
    toast.error("An unknown error occurred while testing the webhook.");
    throw new Error("An unknown error occurred while testing the webhook.");
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
