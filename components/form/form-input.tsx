import useDebounce from "@utils/debounce";
import useJoinClassNames from "@utils/joinClasses";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';

interface FormInputProps
{
  id: string;
  name: string;
  label?: string;
  value: string;
  enabled: boolean;
  required: boolean | undefined;
  minLength?: number;
  updateValue: ( value: string ) => void;
  handleFocus?: () => void;
  handleBlur?: () => void;
}

export default function FormInput({ 
  id, 
  name, 
  enabled, 
  required, 
  value, 
  label, 
  minLength, 
  updateValue,
  handleFocus,
  handleBlur }: FormInputProps )
{
  const [ focused, setFocused ] = useState( false );
  const [ dirty, setDirty ] = useState( false );
  
  const inputRef = useRef<HTMLInputElement>( null );
  const joinClassNames = useJoinClassNames();

  const [ inputValue, setInputValue ] = useState<string>( value ?? "" );
  const debouncedValue = useDebounce( inputValue, 200 );

  useEffect( () => {
    if( debouncedValue ) { updateValue( debouncedValue ); }
  }, [ updateValue, debouncedValue ]);

  const handleChange = useCallback( ( event: ChangeEvent<HTMLInputElement> ) => {
    setInputValue( event.target.value );
  }, []);  
  
  /**
    * Check for input value on component mount to determine if the input is dirty.
    * This is ensure the floating label is shown when the input has a value.
    * @param { string } value - The value of the input.
  */
  useEffect( () => {
    if( value ) {
      setDirty( true );
    }
  }, [ value ] );

  const onBlur = useCallback( () => {
    setFocused( false );

    if( value ) {
      setDirty( true );
    }

    if( handleBlur ) {
      handleBlur();
    }
    
  }, [ value, handleBlur ]);

  return (
    <>
      <input
        ref={ inputRef }
        id={ `${id}-input` }
        type="text"
        name={ name }
        placeholder="Enter value"
        disabled={ !enabled }
        required={ required }
        value={ inputValue }
        minLength={ minLength }
        onChange={ handleChange }
        onFocus={ handleFocus }
        onBlur={ onBlur }
        className="
          peer h-14 w-full
          border border-outline-light 
          rounded-[4px]
          text-sm dark:text-on-surface-dark text-on-surface-light
          bg-transparent
          placeholder-transparent
          focus:outline-none focus:border-2 focus:dark:border-primary-dark focus:border-primary-light"/>
      <label className="absolute left-2 -top-5 text-xs dark:text-on-surface-dark text-on-surface-light peer-focus:font-semibold">{ label }</label>
      {/* <label 
        htmlFor={ `${id}-input` } 
        className={ joinClassNames(
          "absolute left-4 -top-2.5", 
          "text-gray-600 transition-all",
          "peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4","peer-focus:-top-2.5 peer-focus:text-primary-light  peer-focus:px-1 peer-focus:text-xs peer-focus:bg-inherit",
          `${ !focused && dirty ? "px-1 text-xs" : "text-base"}`)}>
        { label }
      </label> */}
    </>
  )
}
