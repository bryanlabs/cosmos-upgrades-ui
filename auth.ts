import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import { getOrCreateAuthUser } from "@/lib/prisma";

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

const providers: Provider[] =
  authentikIssuer && authentikClientId && authentikClientSecret
    ? [
        {
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
        },
      ]
    : [];

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
    async jwt({ token, account, profile }) {
      if (account?.provider === "authentik") {
        const authentikProfile = profile as AuthentikProfile | undefined;
        const subject =
          account.providerAccountId ||
          (typeof authentikProfile?.sub === "string" ? authentikProfile.sub : undefined);

        if (subject) {
          const user = await getOrCreateAuthUser({
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

          token.appUserId = user.id;
          token.identityKey = user.wallet;
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
