"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { Eye, LogIn, Send } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";

// Lazy: the sign-in dialog pulls in the heavy wallet/cosmjs bundle, and only
// signed-out visitors (the minority on this page) ever see it.
const SignInDialog = dynamic(
  () => import("@/components/signin-dialog").then((m) => m.SignInDialog),
  { ssr: false }
);
import { WebhooksPanel } from "@/components/dashboard/webhooks-panel";
import { ChainGrid } from "@/components/sections/chain-grid";
import { useFavoriteChains } from "@/hooks/useFavoriteChains";
import { useAllChainData } from "@/hooks/useChainData";

function CardSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-[200px] w-full rounded-lg" />
      ))}
    </div>
  );
}

export function DashboardView() {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-64 rounded-md" />
        <CardSkeletons />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <EmptyState
        icon={<LogIn className="h-6 w-6" />}
        title="Sign in to see your dashboard"
        description="Your watched chains and upgrade webhooks are tied to your account."
        action={
          <SignInDialog>
            <Button className="gap-2">
              <LogIn className="h-4 w-4" />
              Sign in
            </Button>
          </SignInDialog>
        }
      />
    );
  }

  return (
    <Tabs defaultValue="webhooks" className="space-y-5">
      <TabsList>
        <TabsTrigger value="webhooks" className="gap-2">
          <Send className="h-4 w-4" /> Webhooks
        </TabsTrigger>
        <TabsTrigger value="watchlist" className="gap-2">
          <Eye className="h-4 w-4" /> Watched
        </TabsTrigger>
      </TabsList>
      <TabsContent value="webhooks">
        <WebhooksPanel enabled />
      </TabsContent>
      <TabsContent value="watchlist">
        <WatchlistPanel />
      </TabsContent>
    </Tabs>
  );
}

function WatchlistPanel() {
  const { data: allChains, isLoading: isLoadingChains } = useAllChainData({
    health: "all",
  });
  const {
    favoritesSet,
    isLoadingFavorites,
    updatingFavoriteChainId,
    handleToggleFavorite,
    isConnected,
  } = useFavoriteChains();

  const favoriteChains = useMemo(
    () => (allChains ?? []).filter((chain) => favoritesSet.has(chain.network)),
    [allChains, favoritesSet]
  );

  if (isLoadingChains || isLoadingFavorites) {
    return <CardSkeletons />;
  }

  if (favoriteChains.length === 0) {
    return (
      <EmptyState
        icon={<Eye className="h-6 w-6" />}
        title="No watched chains"
        description="Watch chains from the explorer to keep them here."
      />
    );
  }

  return (
    <ChainGrid
      chains={favoriteChains}
      favoritesSet={favoritesSet}
      updatingFavoriteChainId={updatingFavoriteChainId}
      onToggleFavorite={handleToggleFavorite}
      isConnected={isConnected}
    />
  );
}
