import { lowerCase, upperFirst } from "lodash";

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
        const { formData } = form;
        // TODO: consider a responsive table for displaying forms
          return (
            <div 
              key={ index }
              className="w-full max-w-sm border-b border-outline-light">
              
              <div className="grid">
                <div className="px-2">
                  <h2 className="text-base text-on-surface-light font-semibold">{ upperFirst( lowerCase(form.name) ) }</h2>
                </div>
                <div className="grid px-2 pb-2 text-outline-light">
                  <div className="text-xs">
                    <span className="font-medium">Date applied: </span><span>{ form.createdAt }</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Status: </span><span>{ form.status }</span>
                  </div>
                </div>
              </div>

            </div>
          );
      })}
    </div>
  )
}
