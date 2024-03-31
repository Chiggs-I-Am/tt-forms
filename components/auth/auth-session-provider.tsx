"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import FirebaseAuthProvider from "./firebase-auth-provider";

export default function AuthSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionProvider>
      <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
    </SessionProvider>
  );
}
