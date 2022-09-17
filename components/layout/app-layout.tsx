import { ReactElement } from 'react';
import AppToolbar from "./app-toolbar";

export default function AppLayout( page: ReactElement )
{
  return (
    <div className="layout">
      <AppToolbar />
      <main className="main grid h-full">
        { page }
      </main>
      <footer className="footer grid w-full place-items-center dark:bg-primary-container-dark bg-primary-light">
        <div className="flex flex-col w-full justify-center items-center h-14 px-4 text-sm dark:text-on-primary-container-dark font-medium">
          Otaku Mode
          <span className="text-xs dark:text-on-primary-container-dark text-on-primary-light">stephanthedev@gmail.com</span>
        </div>
      </footer>
    </div>
  )
}