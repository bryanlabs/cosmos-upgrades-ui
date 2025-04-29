/**
 * Mapping from testnet net to their corresponding mainnet net.
 * NOTE: Verify these IDs match the actual identifiers used in your project.
 */
export const testnetToMainnetNetworkMap: { [key: string]: string } = {
  nobletestnet: "noble",
  axelartestnet: "axelar",
  cosmoshubtestnet: "cosmoshub",
  evmostestnet: "evmos",
  junotestnet: "juno",
  fetchhubtestnet: "fetchhub",
};

/**
 * Mapping from mainnet network to their corresponding testnet network.
 * This can be useful for finding the testnet related to a mainnet.
 */
export const mainnetToTestnetNetworkMap: { [key: string]: string } = {
  noble: "nobletestnet",
  axelar: "axelartestnet",
  cosmoshub: "cosmoshubtestnet",
  evmos: "evmostestnet",
  juno: "junotestnet",
  fetchhub: "fetchhubtestnet",
};

/**
 * Mapping from mainnet network names to their logo URLs.
 * Ensure these paths are correct relative to your public directory.
 */
export const mainnetNetworkLogos: { [key: string]: string } = {
  noble:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/noble/images/stake.svg",
  axelar:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/axelar/images/axl.svg",
  cosmoshub:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg",
  evmos:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/evmos/images/evmos.svg",
  juno: "https://raw.githubusercontent.com/cosmos/chain-registry/master/juno/images/juno.svg",
  fetchhub:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/fetchhub/images/fet.svg",
};
