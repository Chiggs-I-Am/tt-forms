import AuthCard from "@components/auth/auth-card";
import { useAuthState } from "@components/auth/user-auth-state";
import { Transition } from "@headlessui/react";
import * as Popover from "@radix-ui/react-popover";
import { Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useCallback, useState } from "react";

interface AppToolbarProps
{
  children?: ReactNode;
  userSession: UserSession | null;
  handleSignOut?: () => void;
  handleSignIn?: () => void;
}

interface UserSession extends Session
{
  user?: {
    name?: string | undefined | null;
    email?: string | undefined | null;
    image?: string | undefined | null;
    userID?: string | undefined | null;
    username?: string | undefined | null;
  }
}

export default function AppToolbar({ children, userSession }: AppToolbarProps)
{
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { user, isNewUser, signInWithGoogle, signInWithEmail, signOut } = useAuthState();

  const router = useRouter();

  const onSignOut = useCallback(() => {
    signOut();
  }, [ signOut ]);

  const checkIsNewUser = useCallback(() => {
    if( isNewUser ) {
      console.log( "is new user?", isNewUser );
      router.push( "/auth/create-username" );
    }
  }, [ isNewUser, router ]);

  const handleGoogleSignIn = useCallback( async () => {
    await signInWithGoogle();
    setShowAuthDialog( false );
    
    if( isNewUser ) {
      console.log( "is new user?", isNewUser );
      router.push( "/auth/create-username" );
    }
  }, [ signInWithGoogle, isNewUser, router ]);

  return (
    <>
      <nav className="z-50 flex items-center justify-between h-14 p-4 shadow-md dark:bg-primary-dark bg-primary-light">
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
          // Move to <UserAvatar user={ userSession.user } />
          <Popover.Root>
            <Popover.Trigger asChild>
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image 
                  src={ `${ user.photoURL }` } 
                  alt="profile image" 
                  layout="fill" />
              </div>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content collisionPadding={{ right: 16 }} className="z-50">
                <Popover.Arrow className="dark:fill-surface-variant-dark fill-surface-light" />
                <div className="w-52 rounded-lg shadow-lg overflow-hidden dark:bg-surface-variant-dark bg-surface-light">
                  <ul className="grid text-center">
                    <li className="flex p-4 items-center justify-center">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden">
                        <Image 
                          src={ `${ user.photoURL }` } 
                          alt="Profile image" 
                          layout="fill" />
                      </div>
                    </li>
                    <li className="h-12 border-b dark:border-outline-dark border-outline-light">
                      <h3 className="text-sm font-semibold dark:text-on-surface-variant-dark text-on-surface-light">{ user.displayName }</h3>
                      <p className="text-xs dark:text-outline-dark text-outline-light">{ user.email }</p>
                    </li>
                    <li className="flex h-12 border-b dark:border-outline-dark border-outline-light">
                      <Link href={ `/${ `username`?.toLowerCase() }/dashboard` }>
                        <a className="flex items-center justify-center w-full text-sm text-center dark:text-on-surface-variant-dark text-on-surface-light font-semibold hover:dark:bg-surface-dark focus:dark:bg-surface-dark dark:outline-primary-dark hover:bg-surface-variant-light focus:bg-surface-variant-light outline-primary-light">Dashboard</a>
                      </Link>
                    </li>
                    <li className="flex items-center justify-center h-12">
                      <button 
                        className="h-10 px-6 rounded-full text-sm font-medium dark:text-primary-dark dark:outline-primary-dark hover:dark:bg-surface-dark focus:dark:bg-surface-dark text-primary-light outline-primary-light  hover:bg-surface-variant-light focus:bg-surface-variant-light focus:ring-0" 
                        onClick={ onSignOut }>
                        Sign out
                      </button>
                    </li>
                  </ul>
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
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
                  handleCloseDialog={ () => setShowAuthDialog(false) } />
              </div>
            </Transition.Child>
          </Transition>
        </>
        : null
      }
    </>
  )
}
