"use client";

import { Button } from "@/components/ui/button";
import { SignInDialog } from "./signin-dialog";
import { useAccount, useDisconnect } from "graz";
import { shortenAddress } from "@/lib/utils";
import { useEffect } from "react";
import { useUserData } from "@/hooks/useUserData";

export function SignInButton() {
  const { data: account } = useAccount();
  const { userData } = useUserData();
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
      {!userData?.wallet && (
        <SignInDialog>
          <Button variant="secondary">Connect Wallet</Button>
        </SignInDialog>
      )}
      {userData?.wallet && (
        <div className="flex items-center gap-2">
          <span>
            {userData?.wallet ? shortenAddress(userData?.wallet) : ""}
          </span>
          <Button variant="secondary" onClick={() => disconnect()}>
            Disconnect
          </Button>
        </div>
      )}
    </>
  );
}

export default SignInButton;
