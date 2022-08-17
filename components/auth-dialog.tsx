import { useCallback, useContext } from "react";
import { UserAuthStateContext } from "./user-auth-state";

export default function AuthDialog( props: any )
{
  // const [ signInWithGoogle, loggedInUser, loading, error ] = useSignInWithGoogle( auth );
  const { user, signInWithGoogle, signOut } = useContext( UserAuthStateContext );

  const handleSignInWithGoogle = useCallback( async () => {
    signInWithGoogle();
  }, [ signInWithGoogle ] );
  
  const handleSignInWithEmail = useCallback( async () => {
    // signInWithEmail();
  }, [] );

  return (
    <div className="grid w-full h-full place-items-center">
      <div className="w-full max-w-sm rounded-xl shadow-md bg-primary-container-light">
        <div className="mx-auto w-fit h-fit p-4 rounded-b-xl bg-primary-light">
          <span className="text-lg font-bold text-on-primary-light">TT FORMS</span>
        </div>
        <div className="grid gap-4 w-full h-full p-4 items-center justify-center">
          <button
            onClick={ handleSignInWithGoogle }
            className="w-full h-10 px-6 rounded-full shadow-md text-sm font-medium bg-surface-light text-on-surface-light outline outline-2 outline-outline-light">
            Sign in with Google
          </button>
          <button
            onClick={ handleSignInWithEmail }
            className="w-full h-10 px-6 rounded-full shadow-md text-sm font-medium bg-surface-light text-on-surface-light outline outline-2 outline-outline-light">
            Sign in with Email
          </button>
        </div>
      </div>
    </div>
  );
}