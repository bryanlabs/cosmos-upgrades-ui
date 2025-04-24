"use client";

import { Button } from "@/components/ui/button";
import { SignInDialog } from "./signin-dialog";
import { useAccount, useDisconnect } from "graz";
import { shortenAddress } from "@/lib/utils";
import { useEffect } from "react";

export function SignInButton() {
  const { isConnected, data: account } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    const checkAndCreateUser = async () => {
      if (account?.bech32Address) {
        try {
          const response = await fetch("/api/user/check-or-create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ walletAddress: account.bech32Address }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "API request failed");
          }

          console.log("User check/create result:", data); // { exists: boolean, created: boolean }
        } catch (error) {
          console.error("Error calling user check/create API:", error);
        }
      }
    };

    checkAndCreateUser();
    // Depend only on account.bech32Address, as isConnected is implicitly handled by its presence
  }, [account?.bech32Address]);

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
