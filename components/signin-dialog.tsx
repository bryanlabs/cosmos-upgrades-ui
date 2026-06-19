"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KeplrIcon, LeapIcon } from "./icons";
import { ShieldCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import { isWalletInstalled, walletLogin, type WalletKind } from "@/lib/wallet/client";
import { toast } from "sonner";

const WALLETS: {
  kind: WalletKind;
  name: string;
  icon: ReactNode;
  install: string;
}[] = [
  { kind: "keplr", name: "Keplr", icon: <KeplrIcon />, install: "https://www.keplr.app/download" },
  { kind: "leap", name: "Leap", icon: <LeapIcon />, install: "https://www.leapwallet.io/#download" },
];

export function SignInDialog({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState<Record<WalletKind, boolean>>({
    keplr: false,
    leap: false,
  });
  const [busy, setBusy] = useState<WalletKind | null>(null);

  // Wallet detection touches window, so resolve it after mount to avoid a
  // hydration mismatch.
  useEffect(() => {
    setInstalled({
      keplr: isWalletInstalled("keplr"),
      leap: isWalletInstalled("leap"),
    });
  }, []);

  const handleAccountSignIn = () => {
    signIn("authentik", { callbackUrl: window.location.href }, { prompt: "login" });
  };

  const handleWallet = async (kind: WalletKind) => {
    setBusy(kind);
    try {
      const credentials = await walletLogin(kind);
      const res = await signIn("wallet", { ...credentials, redirect: false });
      if (!res || res.error) {
        throw new Error("Sign-in was rejected.");
      }
      toast.success("Signed in.");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wallet sign-in failed.");
    } finally {
      setBusy(null);
    }
  };

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

          {WALLETS.map((wallet) => (
            <Button
              key={wallet.kind}
              variant="outline"
              className="gap-2"
              disabled={busy !== null}
              onClick={() =>
                installed[wallet.kind]
                  ? handleWallet(wallet.kind)
                  : window.open(wallet.install, "_blank", "noopener,noreferrer")
              }
            >
              {wallet.icon}
              {busy === wallet.kind
                ? "Check your wallet..."
                : installed[wallet.kind]
                  ? `Connect with ${wallet.name}`
                  : `Install ${wallet.name}`}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
