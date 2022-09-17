import { additionalUserInfo, signInWithEmail, signInWithGoogle } from "@libs/firebase/auth";
import { getFirebase } from "@libs/firebase/firebaseApp";
import { createUser, getFirestoreDocument } from "@libs/firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/router";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface UserAuthStateProps
{
  user: User | null | undefined;
  username: string | undefined;
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
  const { user, username, isNewUser, signInWithGoogle, signInWithEmail, signOut } = useAuthProvider();

  return (
    <UserAuthStateContext.Provider value={{ user, username, isNewUser, signInWithGoogle, signInWithEmail, signOut }}>
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
  const [ username, setUsername ] = useState<string>();

  const { auth } = getFirebase();

  const router = useRouter();

  async function signInWithGoogleProvider() {
    try {
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
    }
    catch( error ) {}
  };

  function signOutUser() {
    signOut( auth );
    setUser( null );
  }

  async function signInWithPasswordLessEmail( email: string ) {
    await signInWithEmail( email, window.location.href );

    router.push("/auth/verify-request");
  }

  useEffect( () => {
    const unsubscribe = onAuthStateChanged( auth, ( user ) => {
      if( user ) {
        setUser( user );

        getFirestoreDocument( "users", user?.uid )
          .then( docData => {
            let username = docData.data()?.username;
            setUsername( username );
        });
      }
    });

    return () => unsubscribe();
  }, [ auth, isNewUser, router ]);

  return {
    user,
    username,
    isNewUser,
    signInWithGoogle: signInWithGoogleProvider,
    signInWithEmail: signInWithPasswordLessEmail,
    signOut: signOutUser,
  };
}