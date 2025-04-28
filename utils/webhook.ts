import { toast } from "sonner";

export const handleAddWebhook = async (
  newWebhookUrl: string,
  newWebhookLabel: string,
  newNotificationType: string,
  newNotifyBeforeUpgrade: string,
  userId: string | undefined,
  chainNetwork: string | undefined,
  fetchWebhooksCallback: () => void,
  resetFields: () => void,
  webhooksCount: number
) => {
  if (webhooksCount >= 4) {
    toast.warning("Maximum of 4 webhooks reached.");
    return;
  }

  if (!newWebhookUrl || !newWebhookLabel || !userId || !chainNetwork) {
    toast.warning(
      "Please select a type, enter a valid webhook URL, and ensure user data is loaded."
    );
    return;
  }

  try {
    new URL(newWebhookUrl);
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
        url: newWebhookUrl,
        label: newWebhookLabel,
        notificationType: newNotificationType,
        notifyBeforeUpgrade: newNotifyBeforeUpgrade,
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
    resetFields();
    fetchWebhooksCallback();
  } catch (error: unknown) {
    console.error("Error adding webhook:", error);
    if (error instanceof Error) {
      toast.error(`Failed to add webhook: ${error.message}`);
    } else {
      toast.error("An unknown error occurred while adding the webhook.");
    }
  }
};

export const handleRemoveWebhook = async (
  webhookId: string,
  fetchWebhooksCallback: () => void
) => {
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
    fetchWebhooksCallback();
  } catch (error: unknown) {
    console.error("Error removing webhook:", error);
    if (error instanceof Error) {
      toast.error(`Failed to remove webhook: ${error.message}`);
    } else {
      toast.error("An unknown error occurred while removing the webhook.");
    }
  }
};
