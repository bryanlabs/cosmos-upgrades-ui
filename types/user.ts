interface Webhook {
  id: string;
  url: string;
  label: string;
}
interface User {
  id: number;
  wallet: string;
  favoriteChains: string;
}

export type { Webhook, User };
