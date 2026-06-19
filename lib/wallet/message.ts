// Shared, dependency-free login-message format so the client (which signs) and
// the server (which verifies) always produce the identical bytes.

export const WALLET_LOGIN_TITLE = "Sign in to Cosmos Upgrade Hub";

/**
 * The exact human-readable message the user signs with their wallet. Changing
 * this format invalidates in-flight nonces but is otherwise safe.
 */
export function buildLoginMessage(address: string, nonce: string): string {
  return `${WALLET_LOGIN_TITLE}\n\nAddress: ${address}\nNonce: ${nonce}`;
}
