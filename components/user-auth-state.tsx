import { auth, signInWithAuthProvider, signOutUser as signOut } from "@libs/firebase/auth";
import { getAdditionalUserInfo, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface UserAuthStateProps
{
  user: User | null | undefined;
  signInWithGoogle: () => void;
  signOut: () => void;
}

export const UserAuthStateContext = createContext<UserAuthStateProps>({} as UserAuthStateProps);

interface UserAuthStateProviderProps
{
  children: ReactNode;
}

export function UserAuthStateProvider({ children }: UserAuthStateProviderProps )
{
  const { user, signInWithGoogle, signOut } = useAuthProvider();

  return (
    <UserAuthStateContext.Provider value={{ user, signInWithGoogle, signOut }}>
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

  const signInWithGoogle = async () => {
    let googleProvider = new GoogleAuthProvider();

    let userCredentials = await signInWithAuthProvider( googleProvider );
    
    setUser( userCredentials?.user );

    if( userCredentials ) {
      let additionalUserInfo = getAdditionalUserInfo( userCredentials );
      let isNewUser = additionalUserInfo?.isNewUser;
      
      setIsNewUser( isNewUser );
    }
  };

  const signOutUser = async () => {
    signOut();

    setUser( null );
  };

  useEffect( () => {
    const unsubscribe = onAuthStateChanged( auth, ( user ) => {
      if( user ) setUser( user );
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    signInWithGoogle,
    signOut: signOutUser,
    isNewUser,
  };
}