import AuthCard from "@components/auth/auth-card";
import { Transition } from "@headlessui/react";
import { Session } from "next-auth";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ReactNode, useCallback, useState } from "react";

interface AppToolbarProps
{
  children?: ReactNode;
  userSession?: Session;
  handleSignOut?: () => void;
  handleSignIn?: () => void;
}

export default function AppToolbar({ children, userSession, handleSignOut, handleSignIn }: AppToolbarProps)
{
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const onSignOut = useCallback(() =>
  {
    if (handleSignOut) handleSignOut();
  }, [handleSignOut]);

  return (
    <div className="z-50">
      <div className="flex items-center justify-between h-14 p-4 shadow-md bg-primary-container-light">

        <div>
          <Link href="/">
            <a className="text-lg font-medium text-on-surface-light select-none">TT Forms</a>
          </Link>
        </div>
        { children }
        { !userSession ?
          <div>
            <button
              onClick={ () => setShowAuthDialog(true) }
              className="flex items-center justify-center text-sm font-medium h-10 px-6 rounded-full shadow-md bg-primary-light text-on-primary-light">Get started</button>
          </div>
          :
          <div className="flex items-center gap-2">
            <h1 className="text-sm text-on-primary-container-light font-medium">{ userSession.user?.email }</h1>
            <button
              onClick={ handleSignOut }
              className="text-sm font-medium h-10 px-6 rounded-full shadow-md bg-primary-light text-on-primary-light">Sign out</button>
          </div>
        }
      </div>
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
              <div className="fixed inset-0 grid place-items-center">
                <AuthCard
                  handleProviderSignIn={ (provider) => signIn(provider) }
                  handleEmailSignIn={ (email) => signIn("email", { email }) }
                  showCloseIcon={ true }
                  handleCloseDialog={ () => setShowAuthDialog(false) } />
              </div>
            </Transition.Child>
          </Transition>
        </>
        : null
      }
    </div>
  )
}
