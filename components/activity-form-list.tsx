import Link from "next/link";

interface ActivityFormListProps
{
  forms: {
    name: string;
    fee: number;
    slug: string;
  }[];
}

export default function ActivityFormList({ forms }: ActivityFormListProps )
{
  return (
    <div className="grid gap-2">
      { forms.map( ( form, index: number ) => {
        const { name, fee, slug } = form;
        return (
          <Link key={ index } href={ `form/${ slug }` }>
            <a className="w-full h-fit rounded-xl shadow-md overflow-hidden dark:bg-primary-dark bg-primary-container-light">
              <figure className="flex min-h-[86px] p-4 justify-between items-center gap-2 select-none cursor-pointer">
                <figcaption className="flex flex-col items-start">
                  <p className="text-sm dark:text-on-primary-dark text-on-primary-container-light font-bold">{ name }</p>
                  <p className="text-xs dark:text-outline-dark text-on-primary-container-light font-semibold">Fee: ${ fee }</p>
                </figcaption>
              </figure>
            </a>
          </Link>
        )
      })}
    </div>
  )
}