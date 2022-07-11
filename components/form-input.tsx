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
  updateValue: ( event: ChangeEvent<HTMLInputElement> ) => void;
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
        value={ value || "" }
        minLength={ minLength }
        onChange={ updateValue }
        onFocus={ handleFocus }
        onBlur={ onBlur }
        className="
          peer h-14 w-full
          border border-outline-light 
          rounded-[4px]
          text-sm text-gray-900 
          placeholder-transparent
          focus:outline-none focus:border-2 focus:border-primary-light"/>
      <label 
        htmlFor={ `${id}-input` } 
        className={ joinClassNames(
          "absolute left-4 -top-2.5", 
          "text-gray-600 bg-on-primary-light transition-all",
          "peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4","peer-focus:-top-2.5 peer-focus:text-primary-light peer-focus:bg-white peer-focus:px-1 peer-focus:text-xs",
          `${ !focused && dirty ? "px-1 text-xs" : "text-base"}`)}>
        { label }
      </label>
    </>
  )
}
