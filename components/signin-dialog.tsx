"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supportedWallets } from "@/lib/wallet";
import { getAvailableWallets, useConnect, WalletType } from "graz";
import { WalletConnect } from "./icons";
import { isMobile } from "react-device-detect";
import { cosmoshub } from "graz/chains";

export function SignInDialog({ children }: { children: React.ReactNode }) {
  const wallets = getAvailableWallets();
  const isWalletInstalled = (wallet: WalletType) => wallets && wallets[wallet];
  const { connect } = useConnect();
  const handleConnect = async (wallet: WalletType) => {
    connect({ chainId: cosmoshub.chainId, walletType: wallet });
  };

  // Filter wallets for mobile and desktop
  const desktopWallets = supportedWallets.filter(
    (wallet) =>
      wallet.walletType === WalletType.KEPLR ||
      wallet.walletType === WalletType.LEAP ||
      wallet.walletType === WalletType.METAMASK_SNAP_LEAP
  );

  const mobileWallets = supportedWallets.filter(
    (wallet) =>
      wallet.walletType === WalletType.WC_KEPLR_MOBILE ||
      wallet.walletType === WalletType.WC_LEAP_MOBILE ||
      wallet.walletType === WalletType.WC_COSMOSTATION_MOBILE
  );

  const walletConnect = supportedWallets.find(
    (wallet) => wallet.walletType === WalletType.WALLETCONNECT
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Choose a provider to sign in to your account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {walletConnect && isWalletInstalled(WalletType.WALLETCONNECT) && (
            <Button
              variant="outline"
              onClick={() => handleConnect(WalletType.WALLETCONNECT)}
            >
              <WalletConnect /> Connect with WalletConnect
            </Button>
          )}

          {!isMobile &&
            desktopWallets.map((wallet) => (
              <Button
                variant="outline"
                onClick={() => handleConnect(wallet.walletType)}
                key={wallet.walletType}
              >
                {wallet.icon}{" "}
                {isWalletInstalled(wallet.walletType)
                  ? "Connect with"
                  : "Install"}{" "}
                {wallet.name}
              </Button>
            ))}

          {isMobile &&
            mobileWallets.map((wallet) => (
              <Button
                variant="outline"
                onClick={() => handleConnect(wallet.walletType)}
                key={wallet.walletType}
              >
                {wallet.icon} {wallet.name}
              </Button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
