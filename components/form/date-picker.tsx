import { ChangeEvent, useCallback, useEffect, useState } from "react";

interface DatePickerProps
{
  value: string;
  minDate: string;
  maxDate: string;
  label: string;
  updateValue: ( value: string ) => void;
};

export default function DatePicker({ value, minDate, maxDate, label, updateValue }: DatePickerProps ) {
  const [ inputValue, setInputValue ] = useState<string>( value ?? "" );

  // const deferredValue = useDeferredValue( inputValue );
  useEffect( () => {
    // if( deferredValue ) { updateValue( deferredValue ); console.log( "value updated" )}
    if( value ) console.log( value );
  }, [value]);

  const handleOnChange = useCallback( ( event: ChangeEvent<HTMLInputElement> ) => {
    setInputValue( event.target.value );

    updateValue( event.target.value );
  }, [ updateValue ]);

  return (
    <>
      <input 
        type="date" 
        name="date" 
        id="date-input"
        value={ inputValue }
        onChange={ handleOnChange }
        min={ minDate }
        max={ maxDate }
        className="
          peer h-14 w-full
          border border-outline-light 
          rounded-[4px]
          text-sm dark:text-on-surface-dark text-on-surface-light
          bg-transparent
          placeholder-transparent
          focus:outline-none focus:border-2 focus:dark:border-primary-dark focus:border-primary-light"/>
      <label className="absolute left-2 -top-5 text-xs dark:text-on-surface-dark text-on-surface-light peer-focus:font-semibold">{ label }</label>
    </>
  )
}
