
interface UserFormsProps
{
  forms: {
    name: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    formData: { [key: string]: {} }
  }[];
}

export default function UserForms({ forms }: UserFormsProps ) {

  return (
    <div>
      { forms.map( ( form, index: number ) => {
        const { name, createdAt, status, formData } = form;
        
          return (
            <div 
              key={ index }
              className="w-full max-w-sm border-b dark:border-outline-dark border-outline-light">
              
              <div className="grid">
                <div className="px-2">
                  <h2 className="text-base dark:text-on-surface-variant-dark text-on-surface-light font-semibold">{ name }</h2>
                </div>
                <div className="grid px-2 pb-2 dark:text-outline-dark text-outline-light">
                  <div className="text-xs">
                    <span className="font-medium">Date applied: </span><span>{ createdAt }</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Status: </span><span>{ status }</span>
                  </div>
                </div>
              </div>

            </div>
          );
      })}
    </div>
  )
}
