import { ReactNode } from "react";

interface ActivitiesListProps 
{
  children: ReactNode;
}

export default function ActivitiesList({ children }: ActivitiesListProps )
{
  return (
    <div className="grid gap-2 w-full place-content-center md:grid-cols-2 lg:grid-cols-3">
      { children }
    </div>
  )
}
