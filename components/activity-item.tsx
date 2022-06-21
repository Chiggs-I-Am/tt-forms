import Link from "next/link";

interface ActivityItemProps 
{
  number: number;
  name: string;
  activities?: string[];
  slug: string;
  fee?: number;
}

export default function ActivityItem({ number, name, activities, slug, fee }: ActivityItemProps ) 
{
  return (
    <div className="max-w-md rounded-xl shadow-md overflow-hidden bg-primary-container-light">
      <figure className="flex w-full h-full p-4 justify-between items-center gap-2">
        <figcaption className="flex flex-col items-start">
          <span className="text-xs text-outline-light font-medium">Form &#35;{ number }</span>
          <p className="text-sm text-on-primary-container-light font-medium md:text-base">{ name }</p>
          {/* <span className="text-xs text-on-primary-container-light font-medium">Fee: ${ fee }</span> */}
        </figcaption>
        <div className="self-center">
          <Link href={`${ slug }`}>
            <a className="block w-fit h-fit rounded-full bg-primary-light select-none group hover:shadow-lg active:shadow-none">
              <span 
                className="flex items-center h-10 px-6 rounded-full 
                  text-sm text-on-primary-light font-medium 
                  group-hover:bg-on-primary-light/[0.08] 
                  group-focus:bg-on-primary-light/[0.12]
                  group-active:bg-on-primary-light/[0.14]">
                  Apply
              </span>
            </a>
          </Link>
        </div>
      </figure>
    </div>
  )
}
