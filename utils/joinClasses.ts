export default function useJoinClassNames()
{
  let joinedClasses = (  ...classes: string[] ) => classes.filter(Boolean).join(" ");

  return joinedClasses;
}