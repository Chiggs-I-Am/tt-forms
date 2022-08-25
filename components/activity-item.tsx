import Image from "next/image";

interface ActivityItemProps 
{
  name: string;
  numberOfForms: number;
  imageURL: string;
  handleOnClick: () => void;
}

export default function ActivityItem({ name, numberOfForms, imageURL, handleOnClick }: ActivityItemProps ) 
{
  return (
    <div className="w-full max-w-xs rounded-xl shadow-md overflow-hidden bg-primary-container-light">
        {/* Card */}
        <div className="flex sm:block">

          <div className="relative w-1/3 max-w-sm sm:w-full sm:aspect-video bg-on-primary-container-light">
            <Image
              src={ imageURL }
              objectFit="cover"
              layout="fill"
              alt="Card image"/>
          </div>

          <div className="flex flex-col w-2/3 gap-1 p-4 sm:w-full">
            
            <h3 className="text-sm font-bold">
              { name }
            </h3>
            
            <p className="text-xs font-medium text-outline-light">{ numberOfForms == 1 ? `${ numberOfForms } Form` : `${ numberOfForms } Forms` }</p>
          
            <div className="mt-2">
              <button 
                className="h-10 px-6 text-sm font-medium rounded-full shadow-md bg-primary-light text-on-primary-light"
                onClick={ handleOnClick }>
                  View Forms
              </button>
            </div>

          </div>
        </div>
      </div>
  )
}
