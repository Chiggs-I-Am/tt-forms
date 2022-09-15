import { UserAuthStateProvider } from "@components/auth/user-auth-state";
import '@styles/globals.css';
import { NextPage } from "next";
import type { AppProps } from 'next/app';
import { ReactElement, ReactNode } from "react";
import { Toaster } from "react-hot-toast";

interface NoopProps
{
  children: ReactElement
}

function Noop({ children }: NoopProps)
{
  return <>{ children }</>;
}

export type NextPageWithLayout<Page = {}, IPage = Page> = NextPage<Page, IPage> & {
  Layout?: (page: ReactElement) => ReactNode
};

interface AppWithLayoutProps extends AppProps
{
  Component: NextPageWithLayout;
}

function MyApp({ Component, pageProps: { ...pageProps } }: AppWithLayoutProps)
{
  const Layout = Component.Layout ?? (page => page);
  
  return (
    <UserAuthStateProvider>
      { 
        Layout(
          <>
            <Component { ...pageProps } />
            <Toaster />
          </>
        )
      }
    </UserAuthStateProvider>
  );
}

export default MyApp
