import { UserAuthStateProvider } from "@components/user-auth-state";
import '@styles/globals.css';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {

  return (
    <UserAuthStateProvider>
      <Component {...pageProps} />
    </UserAuthStateProvider>
  );
}

export default MyApp
