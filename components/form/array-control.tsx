import TTFDialog from "@components/ttf-dialog";
import { PlusIcon, TrashIcon } from "@heroicons/react/solid";
import { ArrayControlProps, composePaths, createDefaultValue } from "@jsonforms/core";
import useDebounce from "@utils/debounce";
import useJoinClassNames from "@utils/joinClasses";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props
{
  handleChange?: ( path: string, value: any ) => void;
}


export default function ArrayControl({
  data,
  id,
  label,
  path,
  addItem,
  removeItems,
  errors,
  enabled,
  visible,
  uischema,
  schema,
  rootSchema,
  handleChange
}: ArrayControlProps & Props ) 
{
  const [ value, setValue ] = useState<string>();
  const [ valueItemPath, setValueItemPath ] = useState<string>();
  const [ valueIndex, setValueIndex ] = useState<number>();

  const [ openDialog, setOpenDialog ] = useState( false );
  
  const [ dirty, setDirty ] = useState( false );
  
  const joinClassNames = useJoinClassNames();
  
  const inputRef = useRef<HTMLInputElement>( null );
  useEffect( () => {
    if( inputRef.current?.value ) {
      setDirty( true );
    }
  }, [ inputRef ]);
  
  const updateDataChange = useCallback( ( path: string, value: any ) => {
    if( handleChange ) handleChange( path, value );
  }, [ handleChange ] );

  const debouncedValue = useDebounce( value, 50 );  
  useEffect( () => {
    if( debouncedValue ) {
      updateDataChange( valueItemPath!, { value: debouncedValue } );
    }
    
    if( debouncedValue === "" || debouncedValue === undefined ) {
      updateDataChange( valueItemPath!, { value: debouncedValue } );
    }
  }, [ debouncedValue, updateDataChange, valueItemPath ]);

  const handleOnChange = useCallback( ( value: string, itemPath: string ) => {
    setValue( value );
    setValueItemPath( itemPath );
  }, []);

  const handleRemoveItem = useCallback( ( path: string, toDelete: number[] ) => {
    if( removeItems ) removeItems( path, toDelete )();
    
    setOpenDialog( false );
  } , [ removeItems ]);

  const showDialog = useCallback( ( idx: number ) => {
    setOpenDialog( true );
    setValueIndex( idx );
  } , []);

  const onBlur = useCallback( () => {
    if( value ) setDirty( true );
  }, [ value ]);

  return (
    <div className="grid gap-6">

      <div className="flex items-center justify-between">

        <div className="text-sm font-medium">{ label }</div>  

        <button 
          disabled={ data ? data.length === 2 : false }
          className="h-10 px-6 text-sm bg-primary-light text-on-primary-light rounded-full shadow-lg"
          onClick={ addItem( path, createDefaultValue( schema ) ) }>
          <PlusIcon className="w-6 h-6" />
        </button>

      </div>

      <TTFDialog
        open={ openDialog }
        title={ "Delete alternative name" }
        dialogBody={ "Are you sure you want to delete this alternative name?" }
        dialogCancelText={ "Cancel" }
        dialogConfirmText={ "Delete" }
        onConfirm={ () => handleRemoveItem( path, [ valueIndex! ]) }
        onCancel={ () => setOpenDialog( false ) } />

      { data ? 
          Object.keys( data ).map( ( item: any, index: number ) => {

            let itemPath = composePaths( path, `${ item }` );

            return(
              <div key={ item } className="relative flex gap-1 justify-between items-center">

                  <input
                    ref={ inputRef }
                    type="text"
                    id={ `${ id }-input` }
                    name={ itemPath }
                    value={ data[ index ].value ?? "" }
                    placeholder={ `Option ${ index + 1 }` }
                    onBlur={ onBlur }
                    onChange={ event => handleOnChange( event.target.value, itemPath )}
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
                      `${ data[index].value && dirty ? "px-1 text-xs" : "text-base"}`)}>
                    { `Option ${ index + 1 }` }
                  </label>

                <button
                  className="h-10 px-2 text-sm bg-error-container-light text-on-error-container-light rounded-full shadow-lg"
                  onClick={ () => { showDialog( item ) }}>
                  <TrashIcon className="w-6 h-6" />
                </button>

              </div>
            );
          }) 
        : null 
      }
    </div>
  )
}
