import FormSelect from "@components/form-select";
import { ControlProps, isDescriptionHidden, isEnumControl, OwnPropsOfEnum, RankedTester, rankWith } from "@jsonforms/core";
import { withJsonFormsEnumProps } from "@jsonforms/react";
import { useState } from "react";
import ValidationHelperText from "./validation-helper-text";

function SelectControl( props: ControlProps & OwnPropsOfEnum ) 
{
  const [ isFocused, setIsFocused ] = useState( false );
  const { config, uischema, options, visible, description, label, required, errors, path, handleChange } = props;

  const uiSchemaOptions = { ...config, ...uischema };

  const isValid = errors.length === 0;
  const showDescription = !isDescriptionHidden( 
    visible, 
    description, 
    isFocused, 
    uiSchemaOptions.showUnfocusedDescription 
  );

  return (
    <div className="relative min-h-[80px]" hidden={ !visible }>
      <FormSelect 
        label={ label }
        options={ options }
        required={ required }
        onChange={ ( option ) => handleChange( path, option ) }
        handleFocus={ () => setIsFocused( true ) }
        handleBlur={ () => setIsFocused( false ) }/>
        
      <div className="px-2 text-black text-xs font-medium">
        { 
          !isValid ? 
            <ValidationHelperText error={ errors } />
            : showDescription ? description : null
        }
      </div>
    </div>
  )
}

export const SelectControlTester: RankedTester = rankWith(
  5,
  isEnumControl
);

export default withJsonFormsEnumProps( SelectControl );