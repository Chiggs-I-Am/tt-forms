import { computeLabel, ControlProps, getAjv, isControl, isDescriptionHidden, RankedTester, rankWith } from "@jsonforms/core";
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react";
import { VanillaRendererProps, withVanillaControlProps } from "@jsonforms/vanilla-renderers";
import { ChangeEvent, useCallback, useState } from "react";
import FormInput from "./form-input";

function TextInputControl( props: ControlProps & VanillaRendererProps )
{
  const [ isFocused, setIsFocused ] = useState( false );
  const [ error, setError ] = useState<string>("");

  const jsonFormsState = useJsonForms();
  const ajv = getAjv({ jsonforms: { ...jsonFormsState } });
  
  const {
    data,
    description,
    id,
    errors,
    handleChange,
    label,
    uischema,
    schema,
    visible,
    enabled,
    required,
    path,
    config
  } = props;
  
  const isValid = errors.length === 0;
  const uiSchemaOptions = { ...config, ...uischema.options };
  const showDescription = !isDescriptionHidden(
    visible,
    description,
    isFocused,
    uiSchemaOptions.showUnfocusedDescription
  );

  const showDescriptionHelperText = showDescription ? description : !isValid ? errors : null;
  const showErrorsHelperText = showDescription && !isValid ? errors : null;
  
  const validateInput = useCallback( () => {
    let validate = ajv.compile( schema );
    let valid = validate( data );

    if( !valid ) { 
      let errors = validate.errors!.map( error => error.message ).join( "\n" );

      setError( errors );

      console.log( errors );
    }
    
    setIsFocused( false );

  }, [ ajv, data, schema]);

  return (
    <div className="relative min-h-[80px]" hidden={ !visible }>
      
      <FormInput
        id={ `${id}-input` }
        name={ path }
        enabled={ enabled }
        required={ required }
        value={ data }
        minLength={ schema.minLength }
        updateValue={ ( event: ChangeEvent<HTMLInputElement> ) => handleChange( path, event.target.value ) }
        label={ computeLabel( label, required!, uiSchemaOptions?.hideRequiredAsterisk ) }
        handleFocus={ () => { setIsFocused( true) }}
        handleBlur={ () => validateInput() }/>

      {/* 
        <ErrorMessage error={ error } classNames={ joinClassNames() } />
      */}
        
      { isValid && showDescription && (
        <div className="text-xs text-black font-medium px-2">
          { description }
        </div>
      )}
      { !isValid && showDescription && (
        <div className="text-xs text-black font-medium px-2">
          { showDescriptionHelperText }
        </div>
      )}
    </div>
  );
}

export default withVanillaControlProps( withJsonFormsControlProps( TextInputControl ) );

export const TextInputControlTester: RankedTester = rankWith( 3, isControl );