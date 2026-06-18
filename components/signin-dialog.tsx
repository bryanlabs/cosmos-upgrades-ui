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
import { signIn } from "next-auth/react";
import { ShieldCheck, Wallet } from "lucide-react";

export function SignInDialog({ children }: { children: React.ReactNode }) {
  const wallets = getAvailableWallets();
  const isWalletInstalled = (wallet: WalletType) => wallets && wallets[wallet];
  const { connect } = useConnect();

  const handleConnect = async (wallet: WalletType) => {
    connect({ chainId: cosmoshub.chainId, walletType: wallet });
  };

  const handleAccountSignIn = () => {
    signIn(
      "authentik",
      { callbackUrl: window.location.href },
      { prompt: "login" }
    );
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
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>
            Use Apple, Google, or a Cosmos wallet to save watchlists and
            notifications.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button className="gap-2" onClick={handleAccountSignIn}>
            <ShieldCheck className="h-4 w-4" />
            Continue with Apple or Google
          </Button>

          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            Wallet
            <span className="h-px flex-1 bg-border" />
          </div>

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
                {wallet.icon || <Wallet className="h-4 w-4" />}{" "}
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
