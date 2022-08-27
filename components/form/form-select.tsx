import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, SelectorIcon } from "@heroicons/react/solid";
import useDebounce from "@utils/debounce";
import useJoinClassNames from "@utils/joinClasses";
import { ChangeEvent, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface FormSelectProps
{
  data: any;
  options: { value: string; label: string }[] | undefined;
  label: string;
  required: boolean | undefined;
  onChange: ( value: string ) => void;
  handleFocus?: () => void;
  handleBlur?: () => void;
}

interface Option
{
  label: string;
  value: string;
}

function FormSelect({ data, options, onChange, label, required, handleFocus, handleBlur }: FormSelectProps )
{
  const [ selectedValue, setSelectedValue ] = useState<string>( data ?? "");
  const [ queryValue, setQueryValue ] = useState<string>("");

  const debouncedValue = useDebounce( selectedValue );

  const [ filteredOptions, setFilteredOptions ] = useState( options );

  const [ focused, setFocused ] = useState( false );
  const [ dirty, setDirty ] = useState( false );

  const isDirty = useMemo( () => selectedValue, [ selectedValue ]);

  const inputRef = useRef<HTMLInputElement>( null );
  const joinClassNames = useJoinClassNames();

  useEffect( () => {
    if( data ) {
      setDirty( true );

      console.log( "data", data );
    }
  }, [ data ]);

  useEffect( () => {
    if( debouncedValue ) {
      onChange( debouncedValue );
    }
  }, [ onChange, debouncedValue ]);

  const onFocus = useCallback( () => {
    setFocused( true );

    if( handleFocus ) { handleFocus(); }
  }, [ handleFocus ]);
  
  const onBlur = useCallback( () => {
    setFocused( false );
    
    if( selectedValue ) {
      setDirty( true );
    }

    if( handleBlur ) {
      handleBlur();
    }
  }, [ handleBlur, selectedValue ])

  useEffect( () => {
    queryValue === "" ? setFilteredOptions( options )
    : setFilteredOptions( 
        options?.filter( option => 
          option.value.toLowerCase().includes( queryValue.toLowerCase() )
      ));
  }, [ queryValue, options ]);

  const onQueryChange = useCallback( ( event: ChangeEvent<HTMLInputElement> ) => {
    setQueryValue( event.target.value );
  }, []);

  const onValueChange = useCallback( ( option: any ) => {
    option ? 
    setSelectedValue( option.label )
    : setSelectedValue("");
  }, []);

  return (
    <>
      <Combobox 
        value={ selectedValue } 
        onChange={ onValueChange }>
        { ({ activeOption }) => (
          <>
            <div className="relative">
              <div className="relative w-full rounded-[4px] bg-surface-light text-left">
                
                <Combobox.Input 
                  ref={ inputRef }
                  className="
                  peer h-14 w-full
                  border border-outline-light
                  rounded-[4px]
                  text-sm text-gray-900 
                  placeholder-transparent
                  focus:outline-none focus:border-2 focus:border-primary-light"
                  required={ required }
                  onChange={ onQueryChange }
                  onFocus={ handleFocus }
                  onBlur={ onBlur }/>

                <Combobox.Label className="absolute left-2 -top-5 text-xs peer-focus:font-semibold">{ label }</Combobox.Label>

                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <SelectorIcon className="w-5 h-5" />
                </Combobox.Button>
                
              </div>
              <Transition
                as={ Fragment }
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={ () => setQueryValue("") }>
                <Combobox.Options className="absolute mt-5 max-h-52 w-full overflow-auto rounded-md bg-surface-light py-1 text-sm shadow-lg z-50 [scrollbar-width:thin] [scrollbar-gutter:auto] [&::-webkit-scrollbar-track]:w-1">
                  { filteredOptions?.length === 0 && queryValue !== "" ? (
                      <div className="relative cursor-default select-none px-4 py-2 text-on-surface-light">
                        Nothing Found.
                      </div>
                    )
                    : 
                    ( filteredOptions?.map( ( filteredOption, index: number ) => (
                      <Combobox.Option 
                        key={ index } 
                        value={ filteredOption } 
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 
                          ${ active ? 'bg-primary-light text-on-primary-light' : 'text-on-surface-light'}`}>
                        { ({ selected, active }) => (
                          <>
                            <span>{ `${ filteredOption.label }` }</span>
                            { selected ? (
                              <span>
                                <CheckIcon className="w-5 h-5" aria-hidden="true"/>
                              </span>
                            ) : null }
                          </>
                        )}
                      </Combobox.Option>
                  )))}
                </Combobox.Options>
              </Transition>
            </div>
        </>
        )}
      </Combobox>
    </>
  )
}

export default FormSelect