import { ReactNode } from 'react';

interface LayoutProps
{
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps ) 
{
  return (
    <main className="flex h-screen">
      { children }
    </main>
  )
}
