type LogoUrls = {
  png: string | null;
  svg: string | null;
};

type ExplorerUrl = {
  kind: string;
  url: string;
};

type ChainUpgradeStatus = {
  type: string; // e.g., "mainnet"
  network: string;
  rpc_server: string;
  rest_server: string;
  latest_block_height: number;
  upgrade_found: boolean;
  upgrade_name: string;
  source: string;
  upgrade_block_height: number | null;
  estimated_upgrade_time: string | null; // ISO date string
  upgrade_plan: string | null; // Changed: API sends this as a JSON string
  version: string;
  error: unknown | null;
  logo_urls: LogoUrls;
  explorer_url: ExplorerUrl;
};

export type { ChainUpgradeStatus };
