import { User } from "firebase/auth";
import Image from "next/image";

interface UserProfileProps
{
  user: User & { username: string | undefined; };
}

export default function UserProfile({ user }: UserProfileProps ) {
  const { displayName, email, photoURL, username } = user;

  return (
    <div className="w-full max-w-xs rounded-lg shadow-lg overflow-hidden dark:bg-secondary-container-dark bg-primary-container-light">
      <div className="grid gap-4 w-full p-4">
        <div className="flex justify-center">
          { photoURL ? 
              <div className="relative w-14 h-14 rounded-full overflow-hidden">
                <Image
                  alt="Profile image"
                  src={ `${ photoURL }` }
                  objectFit="cover"
                  layout="fill"
                  priority />
              </div>
            :
              <div className="grid w-16 h-16 place-items-center rounded-full overflow-hidden dark:bg-tertiary-light dark:text-on-tertiary-light">
                <span className="text-2xl">{ username?.charAt(0) }</span>
              </div>
          }
        </div>
        <div className="text-center">
          { displayName && <h3 className="text-lg dark:text-on-secondary-container-dark text-on-primary-container-light font-semibold">{ `${ displayName }` }</h3> }
          <p className="text-xs font-medium dark:text-outline-dark outline-outline-light">{ `@${ username ?? "Username" }` }</p>
          <p className="text-xs dark:text-outline-dark outline-outline-light">{ `${ email }` }</p>
        </div>
      </div>
    </div>
  )
}
