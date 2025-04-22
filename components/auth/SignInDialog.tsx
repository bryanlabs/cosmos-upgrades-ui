"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Icons } from "@/components/icons"; // Assuming you have an icons component
import { login } from "@/lib/auth-actions";

export function SignInDialog({ children }: { children: React.ReactNode }) {
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
          <Button variant="outline" onClick={() => {}}>
            <Icons.wallet className="mr-2 h-4 w-4" /> Sign in with Keplr
          </Button>
          <Button variant="outline" onClick={() => login("google")}>
            <Icons.google className="mr-2 h-4 w-4" /> Sign in with Google
          </Button>
          <Button variant="outline" onClick={() => login("github")}>
            <Icons.gitHub className="mr-2 h-4 w-4" /> Sign in with GitHub
          </Button>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
