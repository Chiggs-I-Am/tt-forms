import '@styles/globals.css';
import { NextPage } from "next";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from 'next/app';
import { ReactElement, ReactNode } from "react";
import { Toaster } from "react-hot-toast";

interface NoopProps
{
  children: ReactElement
}

function Noop({ children }: NoopProps ) {
  return <>{ children }</>;
}

export type NextPageWithLayout<Page = {}, IPage = Page> = NextPage<Page, IPage> & {
  Layout?: ( page: ReactElement ) => ReactNode
};

interface AppWithLayoutProps extends AppProps
{
  Component: NextPageWithLayout;
}

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppWithLayoutProps )
{
  const Layout = Component.Layout ?? ( page => page );

  return Layout(
    <SessionProvider session={ session }>
      <Component { ...pageProps } />
      <Toaster toastOptions={ {
        success: {
          style: {
            background: "#e3dfff",
            color: "#100069"
          },
        },
        error: {
          style: {
            background: "#ffdad6",
            color: "410002",
          }
        }
      } } />
    </SessionProvider>
  );
}

export default MyApp
