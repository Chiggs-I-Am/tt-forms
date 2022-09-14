import TTFDialog from "@components/ttf-dialog";
import { PlusIcon, TrashIcon } from "@heroicons/react/solid";
import { and, ArrayControlProps, composePaths, ControlElement, createDefaultValue, findUISchema, isObjectArrayControl, RankedTester, rankWith } from "@jsonforms/core";
import { JsonFormsDispatch, withJsonFormsArrayControlProps } from "@jsonforms/react";
import { VanillaRendererProps } from "@jsonforms/vanilla-renderers";
import { range } from "lodash";
import { useCallback, useMemo, useState } from "react";

interface FormArrayControlProps extends ArrayControlProps, VanillaRendererProps {
  handleChange?: ( path: string, value: any ) => void;
}

function FormArrayControl( {
  data,
  id,
  label,
  path,
  addItem,
  removeItems,
  errors,
  enabled,
  visible,
  schema,
  uischema,
  uischemas,
  rootSchema,
  renderers,
  config,
  handleChange }: FormArrayControlProps ) {
  const [openDialog, setOpenDialog] = useState( false );
  const [valueIndex, setValueIndex] = useState( 0 );

  const controlElement = uischema as ControlElement;
  const childUiSchema = useMemo(
    () => findUISchema( uischemas!, schema, uischema.scope, path, undefined, uischema, rootSchema ),
    [uischemas, schema, path, uischema, rootSchema]
  );

  const handleRemoveItem = useCallback( ( path: string, toDelete: number[] ) => {
    if ( removeItems ) removeItems( path, toDelete )();

    setOpenDialog( false );
  }, [removeItems] );

  const showDialog = useCallback( ( idx: number ) => {
    setOpenDialog( true );
    setValueIndex( idx );
  }, [] );

  const uiSchemaOptions = { ...config, ...uischema };

  const length = uiSchemaOptions.length;

  return (
    <div className="grid h-full gap-4 py-4">
      <button
        disabled={ data ? data.length == length : false }
        className="w-fit h-10 px-6 text-sm dark:bg-tertiary-dark dark:text-on-tertiary-dark bg-primary-light text-on-primary-light rounded-full shadow-lg"
        onClick={ addItem( path, createDefaultValue( schema ) ) }>
        <PlusIcon className="w-6 h-6" />
      </button>

      <TTFDialog
        open={ openDialog }
        title={ `Delete this entry?` }
        dialogBody={ "Are you sure you want to delete this entry?" }
        dialogCancelText={ "Cancel" }
        dialogConfirmText={ "Delete" }
        onConfirm={ () => handleRemoveItem( path, [valueIndex!] ) }
        onCancel={ () => setOpenDialog( false ) } />

      { data ? (
        range( 0, data.length )
          .map( ( index ) => {
            const childPath = composePaths( path, `${ index }` );

            return (
              <div className="grid gap-6" key={ index }>
                <header className="flex w-full h-14 px-2 justify-between items-center dark:bg-surface-variant-dark rounded-md bg-surface-variant-light">
                  <label className="dark:text-on-surface-dark text-on-surface-light">{ label } { index + 1 }</label>
                  <button
                    className="h-10 px-2 text-sm dark:bg-error-container-dark dark:text-on-error-container-dark bg-error-container-light text-on-error-container-light rounded-full shadow-lg"
                    onClick={ () => { showDialog( index ) } }>
                    <TrashIcon className="w-6 h-6" />
                  </button>
                </header>
                <JsonFormsDispatch
                  schema={ schema }
                  uischema={ childUiSchema ?? uischema }
                  path={ childPath }
                  key={ childPath }
                  renderers={ renderers } />
              </div> 
            )})) : null
      }
    </div>
  )
}

export const FormArrayControlTester: RankedTester = rankWith( 20, and( isObjectArrayControl ) );

export default withJsonFormsArrayControlProps( FormArrayControl )