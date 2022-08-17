import { ReactNode } from "react";

interface AppToolbarProps
{
  children: ReactNode;
}

export default function AppToolbar({ children }: AppToolbarProps )
{
  return (
    <div className="flex items-center justify-between h-14 p-4 shadow-md bg-primary-container-light">

      <div className="text-lg font-medium text-on-surface-light">TT Forms</div>

      { children }
    </div>
  )
}
