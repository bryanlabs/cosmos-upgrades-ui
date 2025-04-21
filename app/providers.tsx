"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";
import { GrazProvider } from "graz";
import { cosmoshub } from "graz/chains";

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
          }}
        >
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </GrazProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
