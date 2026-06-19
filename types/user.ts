interface Webhook {
  id: number;
  chainId: string;
  url?: string;
  maskedUrl: string;
  label: string;
  notificationType: string;
  notifyBeforeMinutes: number | null;
  notifyBeforeLabel: string | null;
}
interface User {
  id: number;
  wallet: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  authProvider?: string | null;
  favoriteChains: string;
}

export type { Webhook, User };
