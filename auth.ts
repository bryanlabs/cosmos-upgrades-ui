import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { getOrCreateAuthUser } from "@/lib/prisma";
import { verifyWalletLogin } from "@/lib/cosmos-auth";
import { buildLoginMessage } from "@/lib/wallet/message";

type AuthentikProfile = {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  authentik_source?: string | null;
  authentik_sources?: string[];
};

const authentikIssuer = process.env.AUTH_AUTHENTIK_ISSUER;
const authentikClientId = process.env.AUTH_AUTHENTIK_ID;
const authentikClientSecret = process.env.AUTH_AUTHENTIK_SECRET;

// Apple/Google sign-in via Authentik (OIDC). Only enabled when configured.
const authentikProvider: Provider | null =
  authentikIssuer && authentikClientId && authentikClientSecret
    ? {
        id: "authentik",
        name: "Apple or Google",
        type: "oidc",
        issuer: authentikIssuer,
        clientId: authentikClientId,
        clientSecret: authentikClientSecret,
        authorization: {
          params: {
            scope: "openid email profile",
            // Re-run Authentik's source picker instead of silently reusing SSO.
            prompt: "login",
          },
        },
      }
    : null;

// Sign-In With Cosmos: the browser proves control of a wallet address by
// signing a server-issued nonce (ADR-036). We verify the signature server-side
// and mint a session. No wallet SDK ships to the browser.
const walletProvider = Credentials({
  id: "wallet",
  name: "Cosmos Wallet",
  credentials: {
    address: {},
    pubKey: {},
    signature: {},
    nonce: {},
  },
  authorize: async (credentials) => {
    const address = typeof credentials?.address === "string" ? credentials.address : "";
    const pubKey = typeof credentials?.pubKey === "string" ? credentials.pubKey : "";
    const signature = typeof credentials?.signature === "string" ? credentials.signature : "";
    const nonce = typeof credentials?.nonce === "string" ? credentials.nonce : "";
    if (!address || !pubKey || !signature || !nonce) return null;

    // Single-use: the signed nonce must match the cookie we issued, then burn it.
    const cookieStore = await cookies();
    const expectedNonce = cookieStore.get("wallet_nonce")?.value;
    try {
      cookieStore.delete("wallet_nonce");
    } catch {
      // cookie store may be read-only in some contexts; nonce still expires.
    }
    if (!expectedNonce || expectedNonce !== nonce) return null;

    const ok = await verifyWalletLogin({
      address,
      pubKeyB64: pubKey,
      signatureB64: signature,
      message: buildLoginMessage(address, nonce),
    });
    if (!ok) return null;

    const user = await getOrCreateAuthUser({
      provider: "wallet",
      subject: address,
      name: address,
    });
    return { id: String(user.id), name: user.name ?? address, walletAddress: address };
  },
});

const providers: Provider[] = [
  walletProvider,
  ...(authentikProvider ? [authentikProvider] : []),
];

export const authConfig = {
  providers,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "authentik") {
        const authentikProfile = profile as AuthentikProfile | undefined;
        const subject =
          account.providerAccountId ||
          (typeof authentikProfile?.sub === "string" ? authentikProfile.sub : undefined);

        if (subject) {
          const dbUser = await getOrCreateAuthUser({
            provider: account.provider,
            subject,
            email:
              typeof authentikProfile?.email === "string"
                ? authentikProfile.email
                : typeof token.email === "string"
                  ? token.email
                  : null,
            name:
              typeof authentikProfile?.name === "string"
                ? authentikProfile.name
                : typeof token.name === "string"
                  ? token.name
                  : null,
            image:
              typeof authentikProfile?.picture === "string"
                ? authentikProfile.picture
                : typeof token.picture === "string"
                  ? token.picture
                  : null,
          });

          token.appUserId = dbUser.id;
          token.identityKey = dbUser.wallet;
          token.provider = account.provider;
          token.authSource =
            typeof authentikProfile?.authentik_source === "string"
              ? authentikProfile.authentik_source
              : undefined;
          token.authSources = Array.isArray(authentikProfile?.authentik_sources)
            ? authentikProfile.authentik_sources.filter(
                (source): source is string => typeof source === "string"
              )
            : undefined;
        }
      }

      if (user && (account?.provider === "wallet" || account?.type === "credentials")) {
        const walletUser = user as { id?: string | number; walletAddress?: string };
        token.appUserId =
          typeof walletUser.id === "string" ? Number(walletUser.id) : walletUser.id;
        token.identityKey = walletUser.walletAddress;
        token.provider = "wallet";
        token.authSource = "wallet";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.appUserId) {
        session.user.id = String(token.appUserId);
        session.user.identityKey =
          typeof token.identityKey === "string" ? token.identityKey : undefined;
        session.user.provider =
          typeof token.provider === "string" ? token.provider : undefined;
        session.user.authSource =
          typeof token.authSource === "string" ? token.authSource : undefined;
        session.user.authSources = Array.isArray(token.authSources)
          ? token.authSources.filter((source): source is string => typeof source === "string")
          : undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
