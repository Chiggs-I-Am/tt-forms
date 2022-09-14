import { ReactElement, useState } from 'react';
import AppToolbar from "./app-toolbar";

async function getUser( endpoint: string ) {
  let response = await fetch( endpoint );
  return response.json();
}

export default function AppLayout( page: ReactElement )
{
  const [ showAuthDialog, setShowAuthDialog ] = useState( false );
  
  // const username = 

  return (
    <div className="layout">
      <AppToolbar />
      <main className="main grid h-full">
        { page }
      </main>
      <footer className="footer grid place-items-center dark:bg-primary-container-dark">
        <div className="flex items-center h-14 px-4 text-sm dark:text-on-primary-container-dark font-medium">Otaku Mode</div>
      </footer>
    </div>
  )
}