import { RadioGroup } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/solid";
import { EnumOption } from "@jsonforms/core";
import useJoinClassNames from "@utils/joinClasses";
import { useState } from "react";

interface RadioButtonProps
{
  options: EnumOption[] | undefined;
  onChange: ( value: string ) => void;
}

export default function RadioButtonGroup({ options, onChange }: RadioButtonProps )
{
  const [ selected, setSelected ] = useState<string>("");
  const joinClassNames = useJoinClassNames();

  // CONSIDER: update data.value using useState after onChange update handleChange is called
  // e.g. useState( value );
  // onChange={ onChange }
  // useEffect( () => { setSelected( value ) }, [ value ] );

  return (
    <div className="w-full max-w-max">
      <RadioGroup value={ selected } onChange={( data ) => { onChange( data ); setSelected( data ) }}>
        <div className="flex gap-4 select-none">
          { options?.map( ( option: any, index: number ) => (
              <RadioGroup.Option 
                key={ index } 
                value={ option.value } 
                className={ ({ active, checked }) => joinClassNames(
                  `${ active ? "ring-2 ring-white ring-opacity-60 ring-offset-2 ring-offset-primary-container-dark" : "" }`,
                  `${ checked ? "bg-primary-container-light pl-4" : "" }`,
                  "relative flex h-10 px-6 py-2 rounded-full shadow-md overflow-hidden cursor-pointer focus:outline-none"
                )}>
                { ({ active, checked }) =>
                  <>
                    <div className="flex w-full gap-2 items-center justify-between">
                    { checked && (
                        <div className="shrink-0 text-on-primary-container-light">
                          <CheckIcon className="w-4 h-4" />
                        </div>
                    )}
                      <div className="flex items-center">
                        <RadioGroup.Label 
                          className={ 
                            joinClassNames( 
                              `${ checked ? "text-on-primary-container-light" : "text-on-surface-light" }`, "text-xs font-medium cursor-pointer"
                            )}>{ option.label }</RadioGroup.Label>
                      </div>
                    </div>
                  </>
                }
              </RadioGroup.Option>
            )
          )}
        </div>
      </RadioGroup>
    </div>
  );
}