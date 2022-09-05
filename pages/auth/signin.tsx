import AuthCard from "@components/auth/auth-card";
import { useAuthState } from "@components/auth/user-auth-state";
import Container from "@components/layout/container";
import Layout from "@components/layout/layout";
import { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import { useRouter } from "next/router";
import { useCallback } from "react";

interface SigninProps
{
  schema: JsonSchema7;
  uischema: UISchemaElement;
}

export default function Signin() 
{
  const { signInWithGoogle, signInWithEmail } = useAuthState();

  const router = useRouter();

  const handleGoogleSignIn = useCallback( async () => {
    await signInWithGoogle();
    router.push("/");
  }, [ signInWithGoogle, router ]);

  const handleEmailSignIn = useCallback( ( email: string ) => {
    signInWithEmail( email );
  }, [ signInWithEmail ]);

  return (
    <Layout>
      <Container>
        <div className="grid w-full h-full place-items-center">
          <AuthCard 
            handleGoogleSignIn={ handleGoogleSignIn }
            handleEmailSignIn={ ( email ) => handleEmailSignIn( email ) }/>
        </div>
      </Container>
    </Layout>
  )
}