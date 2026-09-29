"use client";

import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Button } from "@workspace/ui/components/button";

// Live auth state for the header. Reads only; enforcement lives in Convex.
export const AuthStatus = ({
  initialEmail,
}: {
  readonly initialEmail: string | null;
}) => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        {initialEmail ?? "Checking sign-in…"}
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/signin"
        className="text-sm font-medium underline underline-offset-4"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-muted-foreground">
        Signed in{initialEmail ? ` as ${initialEmail}` : ""}
      </p>
      <Button variant="outline" size="sm" onClick={() => void signOut()}>
        Sign out
      </Button>
    </div>
  );
};
