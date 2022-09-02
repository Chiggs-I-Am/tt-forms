import { ReactElement, useState } from 'react';
import useSWR from "swr";
import AppToolbar from "./app-toolbar";

async function getUserSession( endpoint: string ) {
  let response = await fetch( endpoint );
  return response.json();
}

export default function AppLayout( page: ReactElement )
{
  const { data, error } = useSWR( "/api/auth/session", getUserSession );
  const [ showAuthDialog, setShowAuthDialog ] = useState( false );

  return (
    <div className="grid grid-flow-row auto-rows-max">
      <AppToolbar userSession={ data } handleSignIn={ () => setShowAuthDialog( true ) } />
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