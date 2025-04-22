// lib/auth.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyADR36Amino } from "@keplr-wallet/cosmos";
import { prisma } from "@/lib/prisma";
import NextAuth from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub,
    Google,
    CredentialsProvider({
      name: "Cosmos Wallet",
      credentials: {
        address: { label: "Wallet Address", type: "text" },
        pubKey: { label: "Public Key", type: "text" },
        signature: { label: "Signature", type: "text" },
        message: { label: "Message", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const { address, pubKey, signature, message } = credentials;

        if (!address || !pubKey || !signature || !message) return null;

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
                data: Buffer.from(message as string).toString("base64"),
              },
            },
          ],
          memo: "",
        };

        const isValid = verifyADR36Amino(
          "cosmos",
          address as string,
          JSON.stringify(signDoc),
          Buffer.from(signature as string, "base64"),
          Buffer.from(pubKey as string, "base64")
        );

        if (!isValid) return null;

        const user = await prisma.user.upsert({
          where: { walletAddress: address as string },
          update: {},
          create: { walletAddress: address as string },
        });

        return user;
      },
    }),
  ],
  adapter: PrismaAdapter(prisma),
});
