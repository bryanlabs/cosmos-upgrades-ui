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
 * Mapping from network names (mainnet and testnet) to their display logo URLs.
 * Testnets currently map to their corresponding mainnet logos.
 * Ensure these paths/URLs are correct.
 */
export const networkLogos: { [key: string]: string } = {
  // Mainnets
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
  zetachain:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/zetachain/images/zetachain.svg",
  stargaze:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/stargaze/images/stars.svg",
  zenrock:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/zenrock/images/zenrock.svg",
  aaronetwork:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/aaronetwork/images/aaron.png",
  arkeo:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/arkeo/images/arkeo.svg",
  doravota:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/doravota/images/dora.svg",
  fxcore:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/fxcore/images/fxcore.svg",
  kimanetwork:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/kimanetwork/images/kima.svg",
  mayachain:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/mayachain/images/maya.svg",
  onomy:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/onomy/images/nom.svg",
  kyve: "https://raw.githubusercontent.com/cosmos/chain-registry/master/kyve/images/kyve.svg",

  // Testnets (using mainnet logos)
  nobletestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/noble/images/stake.svg",
  axelartestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/axelar/images/axl.svg",
  cosmoshubtestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg",
  evmostestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/evmos/images/evmos.svg",
  junotestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/juno/images/juno.svg",
  fetchhubtestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/fetchhub/images/fet.svg",
  zetachaintestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/zetachain/images/zetachain.svg",
  stargazetestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/stargaze/images/stars.svg",
  zenrocktestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/zenrock/images/zenrock.svg",
  aaronetworktestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/aaronetwork/images/aaron.png",
  arkeotestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/arkeo/images/arkeo.svg",
  doravotatestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/doravota/images/dora.svg",
  fxcorntestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/fxcore/images/fxcore.svg",
  kimanetworktestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/kimanetwork/images/kima.svg",
  mayachaintestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/mayachain/images/maya.svg",
  onomytestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/onomy/images/nom.svg",
  kyvetestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/kyve/images/kyve.svg",
  elystestnet:
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/elys/images/elys.svg",

  // Add other network logos here if needed
};

/**
 * Mapping from mainnet network names to their logo URLs.
 * Ensure these paths are correct relative to your public directory.
 */
// This map is now redundant, replaced by networkLogos
// export const mainnetNetworkLogos: { [key: string]: string } = {
//   noble:
//     "https://raw.githubusercontent.com/cosmos/chain-registry/master/noble/images/stake.svg",
//   axelar:
//     "https://raw.githubusercontent.com/cosmos/chain-registry/master/axelar/images/axl.svg",
//   cosmoshub:
//     "https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg",
//   evmos:
//     "https://raw.githubusercontent.com/cosmos/chain-registry/master/evmos/images/evmos.svg",
//   juno: "https://raw.githubusercontent.com/cosmos/chain-registry/master/juno/images/juno.svg",
//   fetchhub:
//     "https://raw.githubusercontent.com/cosmos/chain-registry/master/fetchhub/images/fet.svg",
// };
