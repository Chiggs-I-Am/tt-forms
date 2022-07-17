import { TrashIcon } from "@heroicons/react/solid";
import { ChangeEvent, useState } from "react";
import FormInput from "./form-input";

interface DynamicInputProps 
{
  data: any;
  id: string;
  name: string;
  label: string;
  enabled: boolean;
  required: boolean | undefined;
  updateValue: ( event: ChangeEvent<HTMLInputElement> ) => void;
  handleRemoveItem: () => void;
}

export default function DynamicInput( props: DynamicInputProps )
{
  const [ inputs, setInputs ] = useState([]);
  const { data, id, name, label, required, enabled, updateValue, handleRemoveItem } = props;

  return (
    <>
      <div className="flex w-full justify-between">

        <div className="relative w-full">
          <FormInput 
            id={ id }
            name={ name }
            label={ label }
            value={ data }
            required={ required }
            enabled={ enabled }
            updateValue={ updateValue }/>
        </div>

        <button 
          id="show-delete-dialog-btn"
          className="p-2 hover:text-error-light"
          aria-label="Show delete dialog"
          onClick={ handleRemoveItem }>
          <TrashIcon className="w-6 h-6" />
        </button>

      </div>
    </>
  )
}
