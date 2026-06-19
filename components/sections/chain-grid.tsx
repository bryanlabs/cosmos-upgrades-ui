"use client";

import { useCallback, useState } from "react";
import { ChainCard } from "@/components/chain-card";
import { ChainDetailDialog } from "@/components/chain-detail-dialog";
import { CosmovisorDialog } from "@/components/cosmovisor-dialog";
import { useCosmovisorInfo } from "@/hooks/useCosmosvisorInfo";
import { ChainUpgradeStatus } from "@/types/chain";

interface ChainGridProps {
  chains: ChainUpgradeStatus[];
  favoritesSet: Set<string>;
  updatingFavoriteChainId: string | null;
  onToggleFavorite: (chainId: string) => void;
  isConnected: boolean;
}

// Renders a responsive grid of chain cards and owns the detail + Cosmovisor
// dialogs. Favorites state is passed in so a single useFavoriteChains instance
// per route stays the source of truth (shared by the explorer and dashboard).
export function ChainGrid({
  chains,
  favoritesSet,
  updatingFavoriteChainId,
  onToggleFavorite,
  isConnected,
}: ChainGridProps) {
  const [selectedChain, setSelectedChain] = useState<ChainUpgradeStatus | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCosmovisorDialogOpen, setIsCosmovisorDialogOpen] = useState(false);

  // Stable callbacks so the memoized ChainCard does not re-render on unrelated
  // state changes (e.g. opening the dialog).
  const handleSelect = useCallback((chain: ChainUpgradeStatus) => {
    setSelectedChain(chain);
    setIsDialogOpen(true);
  }, []);

  const handleCosmovisorOpen = useCallback((chain: ChainUpgradeStatus) => {
    setSelectedChain(chain);
    setIsCosmovisorDialogOpen(true);
  }, []);

  const handleDetailClose = () => {
    setIsDialogOpen(false);
    setSelectedChain(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {chains.map((chain) => (
          <ChainCard
            key={chain.network}
            data={chain}
            isFavorite={favoritesSet.has(chain.network)}
            onToggleFavorite={onToggleFavorite}
            isUpdatingFavorite={updatingFavoriteChainId === chain.network}
            isConnected={isConnected}
            onCosmovisorIconClick={handleCosmovisorOpen}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <ChainDetailDialog
        isOpen={isDialogOpen}
        onClose={handleDetailClose}
        chain={selectedChain}
      />

      {selectedChain && isCosmovisorDialogOpen && (
        <RenderCosmovisorDialog
          isOpen={isCosmovisorDialogOpen}
          onClose={() => setIsCosmovisorDialogOpen(false)}
          chain={selectedChain}
        />
      )}
    </>
  );
}

// Calls the Cosmovisor hook only when a chain is selected.
function RenderCosmovisorDialog({
  isOpen,
  onClose,
  chain,
}: {
  isOpen: boolean;
  onClose: () => void;
  chain: ChainUpgradeStatus;
}) {
  const cosmovisorInfo = useCosmovisorInfo(chain);
  const logoUrl = chain?.logo_urls?.png || chain?.logo_urls?.svg;

  return (
    <CosmovisorDialog
      isOpen={isOpen}
      onClose={onClose}
      cosmovisorInfo={cosmovisorInfo}
      estimatedUpgradeTime={chain.estimated_upgrade_time || undefined}
      upgradeFound={chain.upgrade_found}
      chainLogoUrl={logoUrl}
    />
  );
}
