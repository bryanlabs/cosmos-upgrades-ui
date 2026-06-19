// Lean client-side Cosmos wallet access. Keplr and Leap both expose the same
// injected API, so a single thin shim covers both. No SDK dependency ships to
// the browser; login is a nonce + ADR-036 signature verified on the server.

import { buildLoginMessage } from "@/lib/wallet/message";

export type WalletKind = "keplr" | "leap";

// We sign against the Cosmos Hub; the wallet knows this chain natively.
const SIGNING_CHAIN_ID = "cosmoshub-4";

interface InjectedWallet {
  enable(chainId: string): Promise<void>;
  getKey(chainId: string): Promise<{ bech32Address: string }>;
  signArbitrary(
    chainId: string,
    signer: string,
    data: string
  ): Promise<{ signature: string; pub_key: { type: string; value: string } }>;
}

function getInjected(kind: WalletKind): InjectedWallet | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as Record<string, InjectedWallet | undefined>;
  return kind === "keplr" ? w.keplr : w.leap;
}

export function isWalletInstalled(kind: WalletKind): boolean {
  return Boolean(getInjected(kind));
}

export type WalletCredentials = {
  address: string;
  pubKey: string;
  signature: string;
  nonce: string;
};

/**
 * Connects the wallet, fetches a server nonce, and signs the login message.
 * Returns the credentials to hand to NextAuth's "wallet" provider.
 */
export async function walletLogin(kind: WalletKind): Promise<WalletCredentials> {
  const wallet = getInjected(kind);
  if (!wallet) {
    throw new Error(`${kind === "keplr" ? "Keplr" : "Leap"} is not installed.`);
  }

  await wallet.enable(SIGNING_CHAIN_ID);
  const { bech32Address: address } = await wallet.getKey(SIGNING_CHAIN_ID);

  const nonceRes = await fetch("/api/auth/wallet-nonce");
  if (!nonceRes.ok) throw new Error("Could not start wallet sign-in.");
  const { nonce } = (await nonceRes.json()) as { nonce: string };

  const message = buildLoginMessage(address, nonce);
  const signed = await wallet.signArbitrary(SIGNING_CHAIN_ID, address, message);

  return {
    address,
    pubKey: signed.pub_key.value,
    signature: signed.signature,
    nonce,
  };
}
