"use client";

import { getFirebase } from "@/libs/firebase/firebaseApp";
import { signInWithCustomToken, signOut } from "firebase/auth";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";

async function syncFirebaseAuth(session: Session) {
  const { auth } = getFirebase();
  if (session && session.firebaseToken) {
    try {
      await signInWithCustomToken(auth, session.firebaseToken);
    } catch (error) {
      console.error("Error sigining in with custom token", error);
    }
  } else {
    signOut(auth);
  }
}

export default function FirebaseAuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;
    syncFirebaseAuth(session);
  }, [session]);

  return <>{children}</>;
}
