import { ReactNode } from 'react';

interface LayoutProps
{
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps ) 
{
  return (
    <main className="grid h-screen">
      { children }
    </main>
  )
}
