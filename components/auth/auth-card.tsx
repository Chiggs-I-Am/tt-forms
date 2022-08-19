import { signIn } from "next-auth/react";
import { useCallback } from "react";

interface AuthCardProps {
  handleSignIn?: () => void;
}

export default function AuthCard({ handleSignIn }: AuthCardProps )
{
  const handleSignInWithGoogle = useCallback( async () => {
    signIn( "google" );
  }, []);

  const handleSignInWithEmail = useCallback( async ( email: string ) =>
  {
    signIn( "email", { email } );
  }, []);

  return (
    <div className="grid w-full h-full place-items-center">
      <div className="w-full max-w-sm rounded-xl shadow-md bg-primary-container-light">
        <div className="mx-auto w-fit h-fit p-4 rounded-b-xl bg-primary-light">
          <span className="text-lg font-bold text-on-primary-light">TT FORMS</span>
        </div>
        <div className="grid gap-2 w-full h-full p-4 items-center justify-center">

          <div className="grid gap-2">
            <div className="w-full">
              <input type="text" placeholder="Email" className="rounded-xl" />
            </div>
            <button
              onClick={ () => handleSignInWithEmail( "email@example.com" ) }
              className="w-full h-10 px-6 rounded-full shadow-md text-sm font-medium bg-surface-light text-on-surface-light outline outline-2 outline-outline-light">
              Sign in with Email
            </button>
          </div>
          <span className="w-full text-center">or</span>
          <button
            onClick={ handleSignInWithGoogle }
            className="w-full h-10 px-6 rounded-full shadow-md text-sm font-medium bg-surface-light text-on-surface-light outline outline-2 outline-outline-light">
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}