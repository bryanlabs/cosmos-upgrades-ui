"use client";

import { Button } from "@/components/ui/button";
import { SignInDialog } from "./signin-dialog";
import { useAccount, useDisconnect } from "graz";
import { shortenAddress } from "@/lib/utils";

export function SignInButton() {
  const { isConnected, data: account } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <>
      {!isConnected && (
        <SignInDialog>
          <Button variant="secondary">Connect Wallet</Button>
        </SignInDialog>
      )}
      {isConnected && account && (
        <div className="flex items-center gap-2">
          <span>{shortenAddress(account.bech32Address)}</span>
          <Button variant="secondary" onClick={() => disconnect()}>
            Disconnect
          </Button>
        </div>
      )}
    </>
  );
}

export default SignInButton;
