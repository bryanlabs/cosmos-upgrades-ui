"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GrazProvider } from "graz";
import { cosmoshub } from "graz/chains";
import { SessionProvider } from "next-auth/react";

// Create a client
const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(queryClient);

  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        <GrazProvider
          grazOptions={{
            chains: [cosmoshub],
            walletConnect: {
              options: {
                projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
              },
            },
          }}
        >
          {children}
        </GrazProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
