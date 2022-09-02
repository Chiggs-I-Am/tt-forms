import { additionalUserInfo, auth, signInWithEmail, signInWithGoogle } from "@libs/firebase/auth";
import { createUser } from "@libs/firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/router";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface UserAuthStateProps
{
  user: User | null | undefined;
  isNewUser: boolean | undefined;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: ( email: string ) => void;
  signOut: () => void;
}

export const UserAuthStateContext = createContext<UserAuthStateProps>( {} as UserAuthStateProps );

interface UserAuthStateProviderProps
{
  children: ReactNode;
}

export function UserAuthStateProvider({ children }: UserAuthStateProviderProps )
{
  const { user, isNewUser, signInWithGoogle, signInWithEmail, signOut } = useAuthProvider();

  return (
    <UserAuthStateContext.Provider value={{ user, isNewUser, signInWithGoogle, signInWithEmail, signOut }}>
      { children }
    </UserAuthStateContext.Provider>
  );
}

export const useAuthState = () => {
  return useContext( UserAuthStateContext );
};

function useAuthProvider()
{
  const [ user, setUser ] = useState<User | null | undefined>( null );
  const [ isNewUser, setIsNewUser ] = useState<boolean | undefined>( false );

  const router = useRouter();

  async function signInWithGoogleProvider() {
    let userCredential = await signInWithGoogle();
    setUser( userCredential.user );

    let additionalInfo = additionalUserInfo( userCredential );
    let isNewUser = additionalInfo?.isNewUser;
  
    setIsNewUser( isNewUser );

    if( isNewUser ) {
      // redirect user to create-username page
      createUser( userCredential.user );
      router.push( "/auth/create-username" );
    }
  };

  function signOutUser() {
    signOut( auth );
    setUser( null );
  }

  async function signInWithPasswordLessEmail( email: string ) {
    signInWithEmail( email );
  }

  useEffect( () => {
    const unsubscribe = onAuthStateChanged( auth, ( user ) => {
      if( user ) setUser( user );
    });

    return () => unsubscribe();
  }, [ isNewUser, router ]);

  return {
    user,
    isNewUser,
    signInWithGoogle: signInWithGoogleProvider,
    signInWithEmail: signInWithPasswordLessEmail,
    signOut: signOutUser,
  };
}