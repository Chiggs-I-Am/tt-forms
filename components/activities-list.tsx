import { ReactNode } from "react";

interface ActivitiesListProps 
{
  children: ReactNode;
}

export default function ActivitiesList({ children }: ActivitiesListProps )
{
  return (
    <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
      { children }
    </div>
  )
}
