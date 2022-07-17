import DynamicInput from "@components/dynamic-input";
import TTFDialog from "@components/ttf-dialog";
import { PlusIcon } from "@heroicons/react/solid";
import { ArrayControlProps, composePaths, createDefaultValue, isArrayObjectControl, RankedTester, rankWith } from "@jsonforms/core";
import { withJsonFormsArrayControlProps } from "@jsonforms/react";
import { useCallback, useState } from "react";

interface DynamicInputControlProps extends ArrayControlProps
{
  handleChange?: ( path: string, value: any ) => void;
}

function DynamicInputControl( props: DynamicInputControlProps )
{
  const { data, label, id, path, enabled, required, addItem, removeItems, schema, handleChange } = props;
  const [ open, setOpen ] = useState( false );
  const [ valueIndex, setIndex ] = useState<number>();

  const onChange = useCallback( ( event: any, itemPath: string ) => {
    handleChange!( itemPath, { value: event.target.value } );
  }, [ handleChange ]);

  const handeAddItem = useCallback( ( path: string, value: any ) => {
    addItem( path, value )();
  }, [ addItem ]);

  const handleRemoveItem = useCallback( ( path: string, index: number[] ) => {
    console.log( "Remove item: ", path, index );
    removeItems!( path, index )();
    setOpen( false );
  }, [ removeItems ]);

  const showDialog = useCallback( ( idx: number ) => {
    setOpen( true );

    setIndex( idx );
  }, []);

  return (
    <div className="grid gap-4">

      <div className="inline-flex w-full justify-between items-center">

        <div className="">
          <h2 className="text-sm font-medium">{ label }</h2>
        </div>
        
        <button 
          disabled={ data ? data.length === 2 : false }
          className="inline-flex h-10 pl-4 pr-6 justify-center items-center rounded-full shadow-lg bg-primary-container-light text-sm text-on-primary-container-light font-medium"
          onClick={ () => handeAddItem( path, createDefaultValue( schema ) ) }>
            <PlusIcon className="w-6 h-6 pr-2" />
            <span className="text-sm font-medium">Add</span>
        </button>

      </div>

      <TTFDialog 
        open={ open }
        title={ "Delete alternative name" }
        dialogBody={ "Are you sure you want to delete this alternative name?" }
        dialogCancelText={ "Cancel" } 
        dialogConfirmText={ "Delete" }
        onConfirm={ () => handleRemoveItem( path, [ valueIndex! ] ) }
        onCancel={ () => setOpen( false ) }/>

      { data ? Object.keys(data).map( ( item: any, index: number ) => {

        let itemPath = composePaths( path, `${ item }` );

        return (
          <div key={ index }>
            
            <DynamicInput 
              data={ data[ item ].value ?? "" }
              id={ `${ id }-input` }
              name={ itemPath } 
              label={ `Option ${ index + 1 }` }
              enabled={ enabled } 
              required={ required }
              updateValue={ ( event: any ) => onChange( event, itemPath ) }
              handleRemoveItem={ () => showDialog( index ) }/>

          </div>
        );
      } ) : null }
    </div>
  );
}

export const DynamicInputControlTester: RankedTester = rankWith( 10, isArrayObjectControl );

export default withJsonFormsArrayControlProps( DynamicInputControl );