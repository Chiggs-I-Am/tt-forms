import { Popover } from "@headlessui/react";
import { User } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePopper } from "react-popper";

interface UserAvatarProps
{
  user: User & { username: string | undefined };
  handleSignOut: () => void;
}

export default function UserAvatar( { user, handleSignOut }: UserAvatarProps )
{
  const [refElement, setRefElement] = useState<HTMLButtonElement | null>( null );
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>( null );

  const { styles, attributes } = usePopper( refElement, popperElement,
  {
    placement: "bottom-end",
    modifiers: [
      { name: "offset", options: { offset: [0, 4] } }
    ]
  });

  const router = useRouter();

  useEffect(() => {
    router.prefetch( `/${ user.username?.toLowerCase() }` )
  }, [ router, user ]);
  

  return (
    <Popover className="relative h-8">
      <Popover.Button ref={ setRefElement }>
        <div className="relative w-8 h-8 rounded-full overflow-hidden">
          <Image
            src={ `${ user.photoURL }` }
            alt="profile image"
            layout="fill" />
        </div>
      </Popover.Button>
      <Popover.Panel
        ref={ setPopperElement }
        style={ styles.popper }
        { ...attributes.popper }
        className="absolute z-10 w-52 rounded-lg shadow-lg overflow-hidden dark:bg-surface-variant-dark bg-surface-light">
        { ( { close } ) => (
          <ul className="grid text-center">
            <li className="flex p-4 items-center justify-center">
              <div className="relative w-16 h-16 rounded-full overflow-hidden">
                <Image
                  src={ `${ user.photoURL }` }
                  alt="Profile image"
                  layout="fill"
                  loading="lazy" />
              </div>
            </li>
            <li className="h-12 border-b dark:border-outline-dark border-outline-light">
              <h3 className="text-sm font-semibold dark:text-on-surface-variant-dark text-on-surface-light">{ user.username }</h3>
              <p className="text-xs dark:text-outline-dark text-outline-light">{ user.email }</p>
            </li>
            <li onClick={ () => close() } className="flex h-12 border-b dark:border-outline-dark border-outline-light">
              <Link href={ `/${ `${ user.username?.toLowerCase() }` }/dashboard` }>
                <a className="flex items-center justify-center w-full text-sm text-center dark:text-on-surface-variant-dark text-on-surface-light font-semibold hover:dark:bg-surface-dark focus:dark:bg-surface-dark dark:outline-primary-dark hover:bg-surface-variant-light focus:bg-surface-variant-light outline-primary-light">Dashboard</a>
              </Link>
            </li>
            <li className="flex items-center justify-center h-12">
              <button
                className="h-10 px-6 rounded-full text-sm font-medium dark:text-primary-dark dark:outline-primary-dark hover:dark:bg-surface-dark focus:dark:bg-surface-dark text-primary-light outline-primary-light  hover:bg-surface-variant-light focus:bg-surface-variant-light focus:ring-0"
                onClick={ handleSignOut }>
                Sign out
              </button>
            </li>
          </ul>
        ) }
      </Popover.Panel>
    </Popover>
  )
}
