"use client";

import { Button } from "@/components/ui/button";
import { SignInDialog } from "./signin-dialog";
import { signOut, useSession } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";

export function SignInButton() {
  const { data: session, status } = useSession();
  const authSource = session?.user?.authSource || session?.user?.authSources?.[0];
  const sourceLabel = authSource ? formatAuthSource(authSource) : null;
  const isExternalAccount = sourceLabel === "Apple" || sourceLabel === "Google";
  const rawDisplayName = session?.user?.name;
  const displayName =
    isExternalAccount && session?.user?.email
      ? session.user.email
      : rawDisplayName && rawDisplayName !== "authentik Default Admin"
      ? rawDisplayName
      : session?.user?.email || session?.user?.identityKey || "Signed in";

  const handleSignOut = async () => {
    await signOut({ redirect: false, callbackUrl: "/" });
    const logoutUrl = new URL(
      "https://authentik.media.bryanlabs.net/application/o/upgrade-hub/end-session/"
    );
    logoutUrl.searchParams.set("post_logout_redirect_uri", window.location.origin + "/");
    window.location.assign(logoutUrl.toString());
  };

  return (
    <>
      {status !== "authenticated" && (
        <SignInDialog>
          <Button variant="secondary" className="gap-2">
            <LogIn className="h-4 w-4" />
            Sign in
          </Button>
        </SignInDialog>
      )}
      {status === "authenticated" && (
        <div className="flex items-center gap-2">
          <span className="flex max-w-[18rem] items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
            {sourceLabel && (
              <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
                {sourceLabel}
              </span>
            )}
            <span className="truncate">{displayName}</span>
          </span>
          <Button
            variant="secondary"
            onClick={handleSignOut}
            size="sm"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      )}
    </>
  );
}

function formatAuthSource(source: string) {
  switch (source.toLowerCase()) {
    case "apple":
      return "Apple";
    case "google":
      return "Google";
    case "plex":
      return "Plex";
    default:
      return source;
  }
}

export default SignInButton;
