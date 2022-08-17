import useJoinClassNames from "@utils/joinClasses";
import { ReactNode } from 'react';

interface ButtonProps
{
  buttonText: string;
  icon?: ReactNode;
  role: "primary" | "secondary" | "tertiary" | "error";
  onClick: () => void;
}

export default function Button({ buttonText, icon, role, onClick }: ButtonProps ) 
{
  const joinClassNames = useJoinClassNames();

  return (
    <>
      <button 
        className={
          joinClassNames("flex w-fit h-fit justify-center items-center rounded-full overflow-hidden hover:shadow-lg group",
          `${ role === "primary" ? "bg-primary-light text-on-primary-light" 
              : role === "secondary" ? "bg-secondary-light text-on-secondary-light" 
              : role === "tertiary" ? "bg-tertiary-light text-on-tertiary-light"
              : "" }`)}
        onClick={ onClick }>
        { icon }
        <span
          className={
          joinClassNames(
            "inline-flex items-center h-10 px-6 text-sm font-medium" ,
            "group-hover:bg-primary-light/[0.08] group-focus:bg-primary-light/[0.12] group-active:bg-primary-light/[0.14]",
            )}>
          { buttonText }</span>
      </button>
    </>
  )
}
