import { RadioGroup } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/solid";
import { EnumOption } from "@jsonforms/core";
import useDebounce from "@utils/debounce";
import useJoinClassNames from "@utils/joinClasses";
import { useCallback, useEffect, useState } from "react";

interface RadioButtonProps
{
  data: any;
  options: EnumOption[] | undefined;
  onChange: ( value: string ) => void;
}

export default function RadioButtonGroup({ data, options, onChange }: RadioButtonProps )
{
  const [ selected, setSelected ] = useState<string>( data ?? "");
  const joinClassNames = useJoinClassNames();

  const debouncedValue = useDebounce( selected, 250 );

  useEffect( () => {
    if( debouncedValue ) { onChange( debouncedValue ); }
  }, [ debouncedValue, onChange ]);

  const handleChange = useCallback( ( value: string ) => {
    setSelected( value );
  }, []);

  return (
    <div className="w-full max-w-max">
      <RadioGroup value={ selected } onChange={ handleChange }>
        <div className="flex gap-4 select-none">
          { options?.map( ( option: any, index: number ) => (
              <RadioGroup.Option 
                key={ index } 
                value={ option.value } 
                className={ ({ active, checked }) => joinClassNames(
                  `${ active ? "ring-2 ring-white ring-opacity-60 ring-offset-2 ring-offset-primary-container-dark" : "" }`,
                  `${ checked ? "bg-primary-container-light pl-4" : "" }`,
                  "relative flex h-10 px-6 py-2 rounded-full overflow-hidden shadow-md cursor-pointer focus:outline-none"
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