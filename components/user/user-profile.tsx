import Image from "next/image";

interface UserProfileProps
{
  name: string;
  email: string;
  image: string;
}

export default function UserProfile({ name, email, image }: UserProfileProps ) {
  return (
    <div className="w-full max-w-xs rounded-lg shadow-lg overflow-hidden bg-primary-container-light">
      <div className="grid gap-4 w-full p-4">
        <div className="flex justify-center">
          <div className="relative w-14 h-14 rounded-full overflow-hidden">
            <Image
              alt="Profile image"
              src={ `${ image }` }
              objectFit="cover"
              layout="fill"/>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg text-on-primary-container-light font-medium">{ `${ name }` }</h3>
          <p className="text-xs">{ `${ email }` }</p>
        </div>
      </div>
    </div>
  )
}
