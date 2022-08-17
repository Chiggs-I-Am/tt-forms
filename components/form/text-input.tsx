import { computeLabel, ControlProps, getAjv, isControl, isDescriptionHidden, RankedTester, rankWith } from "@jsonforms/core";
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react";
import { VanillaRendererProps, withVanillaControlProps } from "@jsonforms/vanilla-renderers";
import { useCallback, useState } from "react";
import FormInput from "./form-input";
import ValidationHelperText from "./validation-helper-text";

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

  const handleFocus = useCallback( () => {
    setIsFocused( true );

    setError( "" );
  }, []);
  
  const validateInput = useCallback( () => {
    let validate = ajv.compile( schema );
    let valid = validate( data );

    if( !valid ) { 
      let errors = validate.errors!.map( error => error.message ).join( "\n" );
      setError( errors );
    }
    
    setIsFocused( false );

  }, [ ajv, data, schema ]);

  const updateValue = useCallback( ( value: string ) => {
    handleChange( path, value );
  }, [ handleChange, path ]);

  return (
    <div className="relative min-h-[80px]" hidden={ !visible }>
      
      <FormInput
        id={ `${id}-input` }
        name={ path }
        enabled={ enabled }
        required={ required }
        value={ data }
        minLength={ schema.minLength }
        updateValue={ updateValue }
        label={ computeLabel( label, required!, uiSchemaOptions?.hideRequiredAsterisk ) }
        handleFocus={ handleFocus }
        handleBlur={ () => validateInput() }/>
        
      <div className="text-xs text-black font-medium px-2">
        { 
          !isValid || error ? 
            <ValidationHelperText error={ error } />
            : showDescription ? description : null
        }
      </div>
    </div>
  );
}

export default withVanillaControlProps( withJsonFormsControlProps( TextInputControl ) );

export const TextInputControlTester: RankedTester = rankWith( 3, isControl );