"use client";

import { Button, Card, Heading, Text } from "@radix-ui/themes";
import { signIn, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SignIn() {
  const [showSignUp, setShowSignUp] = useState(false);
  const params = useSearchParams();
  const callbackURL = params.get("callbackUrl") as string;

  return (
    <>
      <Card>
        <Heading as="h1" size="5" mb="4" align="center">
          {!showSignUp ? "Welcome back" : "Join TT-Forms"}
        </Heading>
        <div className="grid w-full gap-2">
          <Button
            variant="outline"
            color="gray"
            size="3"
            onClick={() => {
              signIn("google", { callbackUrl: callbackURL });
            }}
          >
            {!showSignUp ? "Sign in with Google" : "Sign up with Google"}
          </Button>
          <Button
            variant="outline"
            color="gray"
            size="3"
            onClick={() => {
              // signIn("email");
              signOut();
            }}
          >
            {/* <span className="material-symbols-outlined">mail</span> */}
            {!showSignUp ? "Sign in with email" : "Sign up with email"}
          </Button>
        </div>

        <div className="grid h-10 items-center">
          <Text as="p" size="1" align="center">
            {!showSignUp
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <Text
              className="cursor-pointer font-medium text-blueA-11 hover:underline"
              onClick={() => {
                setShowSignUp((prev) => !prev);
              }}
            >
              {!showSignUp ? "Sign up" : "Sign in"}
            </Text>
          </Text>
        </div>
      </Card>
    </>
  );
}
