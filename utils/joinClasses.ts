import { twMerge } from "tailwind-merge";

/* 
  This function is used to merge classnames together.

  @param args - The classnames to merge.

  @example
    import { joinClasses } from 'utils/joinClasses';
    joinClasses('text-red-500', null, 'text-xl');
    // => 'text-red-500 text-xl'

  @returns The merged classnames.
*/
export function joinClasses(...args: unknown[]) {
  const classes = args.filter(Boolean).join(' ');
  // twMerge removes any duplicates
  return twMerge( classes );
}