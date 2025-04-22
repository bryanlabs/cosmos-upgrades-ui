import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { verifyADR36Amino } from "@keplr-wallet/cosmos";

const prisma = new PrismaClient();

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!, // Replace with your Google Client ID
      clientSecret: process.env.GITHUB_SECRET!, // Replace with your Google Client Secret
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!, // Replace with your Google Client ID
      clientSecret: process.env.GOOGLE_SECRET!, // Replace with your Google Client Secret
    }),
    CredentialsProvider({
      name: "Cosmos Wallet",
      credentials: {
        address: { label: "Wallet Address", type: "text" },
        pubKey: { label: "Public Key", type: "text" },
        signature: { label: "Signature", type: "text" },
        message: { label: "Message", type: "text" }, // e.g. "Sign in to MyApp at <timestamp>"
      },
      async authorize(credentials) {
        // Check if credentials exist
        if (!credentials) {
          return null;
        }
        const { address, pubKey, signature, message } = credentials;

        if (!address || !pubKey || !signature || !message) return null;

        // Create the ADR-36 sign doc
        const signDoc = {
          chain_id: "",
          account_number: "0",
          sequence: "0",
          fee: { gas: "0", amount: [] },
          msgs: [
            {
              type: "sign/MsgSignData",
              value: {
                signer: address,
                data: Buffer.from(message).toString("base64"),
              },
            },
          ],
          memo: "",
        };

        // 🔐 Verify signature
        const isValid = verifyADR36Amino(
          "cosmos", // Assuming 'cosmos' as the prefix, change if needed
          address,
          JSON.stringify(signDoc),
          Buffer.from(signature, "base64"), // Signature needs to be Uint8Array
          Buffer.from(pubKey, "base64") // Public key needs to be Uint8Array
        );

        if (!isValid) return null;

        // 👤 Find or create user
        const user = await prisma.user.upsert({
          where: { walletAddress: address },
          update: {},
          create: { walletAddress: address },
        });

        return user;
      },
    }),
    // Add other providers here (e.g., Credentials, GitHub, etc.)
  ],
  pages: {
    signIn: "/auth/signin",
  },
  // Optional: Add session configuration, callbacks, pages, etc.
  // session: {
  //   strategy: "jwt", // or "database"
  // },
  // callbacks: {
  //   async session({ session, token, user }) {
  //     // Send properties to the client, like an access_token and user id from a provider.
  //     session.accessToken = token.accessToken
  //     session.user.id = token.id

  //     return session
  //   }
  // }
  // pages: {
  //   signIn: '/auth/signin', // Custom sign-in page path
  // },
});

export { handler as GET, handler as POST };
