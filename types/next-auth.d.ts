import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      identityKey?: string;
      provider?: string;
      authSource?: string;
      authSources?: string[];
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    appUserId?: number;
    identityKey?: string;
    provider?: string;
    authSource?: string;
    authSources?: string[];
  }
}
