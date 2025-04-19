type UpgradePlan = {
  height: number;
  binaries: string[];
  name: string;
  upgraded_client_state: unknown | null;
};

type ChainUpgradeStatus = {
  type: "mainnet" | string;
  network: string;
  rpc_server: string | null;
  rest_server: string | null;
  latest_block_height: number | null;
  upgrade_found: boolean;
  upgrade_name: string | null;
  source: "active_upgrade_proposals" | "current_upgrade_plan" | null;
  upgrade_block_height: number | null;
  estimated_upgrade_time: string | null;
  upgrade_plan: UpgradePlan | null;
  version: string | null;
  error: string | null;
};

export type { ChainUpgradeStatus };
