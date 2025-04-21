type ChainUpgradePlan = {
  height: number;
  binaries: string[];
  name: string;
  upgraded_client_state: unknown | null;
};

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
  upgrade_plan: ChainUpgradePlan | null;
  version: string;
  error: unknown | null;
  logo_urls: LogoUrls;
  explorer_url: ExplorerUrl;
};

export type { ChainUpgradeStatus };
