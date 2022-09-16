import AuthCard from "@components/auth/auth-card";
import { useAuthState } from "@components/auth/user-auth-state";
import UserAvatar from "@components/user/user-avatar";
import { Transition } from "@headlessui/react";
import { firestore } from "@libs/firebase/firestore";
import { collection, deleteDoc, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useCallback, useEffect, useState } from "react";

interface AppToolbarProps
{
  children?: ReactNode;
  handleSignOut?: () => void;
  handleSignIn?: () => void;
}

export default function AppToolbar( { children }: AppToolbarProps )
{
  const [showAuthDialog, setShowAuthDialog] = useState( false );
  const { user, username, isNewUser, signInWithGoogle, signInWithEmail, signOut } = useAuthState();

  const router = useRouter();

  const onSignOut = useCallback( async () => {    
    const sessionsCollectionRef = collection(firestore, "sessions");
    const sessionsQuery = query( sessionsCollectionRef, where( "userID", "==", user?.uid! ) );
    const sessionDocs = await getDocs( sessionsQuery );
    if( !sessionDocs.empty ) {
      let sessionDoc = sessionDocs.docs[0].ref;
      deleteDoc( sessionDoc );
    }
    
    signOut();
  }, [signOut, user] );

  const checkIsNewUser = useCallback( () =>
  {
    if ( isNewUser ) {
      console.log( "is new user?", isNewUser );
      router.push( "/auth/create-username" );
    }
  }, [isNewUser, router] );

  const handleGoogleSignIn = useCallback( async () =>
  {
    await signInWithGoogle();
    setShowAuthDialog( false );

    if ( isNewUser ) {
      console.log( "is new user?", isNewUser );
      router.push( "/auth/create-username" );
    }
  }, [signInWithGoogle, isNewUser, router] );

  useEffect( () => {
    checkIsNewUser();
  }, [ checkIsNewUser ]);

  return (
    <>
      <nav className="nav z-50 flex items-center justify-between h-14 p-4 shadow-md dark:bg-primary-dark bg-primary-light">
        <div>
          <Link href="/">
            <a className="text-lg font-medium text-on-surface-light select-none">TT Forms</a>
          </Link>
        </div>
        { children }
        { !user ?
          <button
            onClick={ () => setShowAuthDialog( true ) }
            className="flex items-center justify-center text-sm font-medium h-10 px-6 rounded-full shadow-md dark:bg-secondary-container-dark dark:text-on-secondary-container-dark bg-secondary-container-light text-on-secondary-container-light">
            Get started
          </button>
          :
          <UserAvatar user={{ ...user, username }} handleSignOut={ onSignOut } />
        }
      </nav>
      { showAuthDialog ?
        <>
          <Transition appear={ true } show={ showAuthDialog }>
            <Transition.Child
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black opacity-25" />
            </Transition.Child>

            <Transition.Child>
              <div className="fixed inset-0 grid place-items-center z-50">
                <AuthCard
                  handleGoogleSignIn={ handleGoogleSignIn }
                  handleEmailSignIn={ ( email ) => signInWithEmail( email ) }
                  showCloseIcon={ true }
                  handleCloseDialog={ () => setShowAuthDialog( false ) } />
              </div>
            </Transition.Child>
          </Transition>
        </>
        : null
      }
    </>
  )
}
