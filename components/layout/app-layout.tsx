import { useAuthState } from "@components/auth/user-auth-state";
import { ReactElement, useState } from 'react';
import AppToolbar from "./app-toolbar";

async function getUser( endpoint: string ) {
  let response = await fetch( endpoint );
  return response.json();
}

export default function AppLayout( page: ReactElement )
{
  const { user } = useAuthState();
  const [ showAuthDialog, setShowAuthDialog ] = useState( false );
  
  // const username = 

  return (
    <div className="grid grid-flow-row auto-rows-max">
      <AppToolbar handleSignIn={ () => setShowAuthDialog( true ) } />
      {/* NOTE: height = viewport height - navbar height */}
      <main className="grid h-[calc(100vh-56px)]">
        { page }
      </main>
      <footer className="grid place-items-center dark:bg-primary-container-dark">
        <div className="flex items-center h-12 px-4 text-sm dark:text-on-primary-container-dark font-medium">Otaku Mode</div>
      </footer>
    </div >
  )
}