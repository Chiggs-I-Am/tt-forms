import StepperLayout, { StepperLayoutTester } from "@components/stepper-layout";
import TextInputControl, { TextInputControlTester } from "@components/text-input";
import { createAjv, JsonSchema7, UISchemaElement } from "@jsonforms/core";
import { JsonForms } from "@jsonforms/react";
import { JsonFormsStyleContext, useStyles, vanillaCells, vanillaRenderers } from "@jsonforms/vanilla-renderers";
import useJoinClassNames from "@utils/joinClasses";
import ajvErrors from "ajv-errors";
import ajvKeywords from "ajv-keywords";
import { useState } from 'react';

interface DynamicFormProps
{
  schema: JsonSchema7;
  uischema: UISchemaElement
}

export default function DynamicForm({ schema, uischema }: DynamicFormProps )
{
  const [ formData, setFormData ] = useState<{} | null>(null);
  const joinClassNames = useJoinClassNames();
  const styles = useStyles();

  const renderers = [
    ...vanillaRenderers,
    { tester: StepperLayoutTester, renderer: StepperLayout },
    { tester: TextInputControlTester, renderer: TextInputControl }
  ];

  const cells = [
    ...vanillaCells
  ];

  const styleContext = { styles: [
    ...styles,
    {
      name: "control",
      classNames: [ joinClassNames( "grid" ) ]
    }
  ]};

  const ajv = ajvErrors( createAjv({ useDefaults: true }) );
  ajvKeywords( ajv, ["transform"] );

  /* function handleInputChange( data: any, errors: any ) {
    const validate = ajv.compile( { $ref: `${ schema.$id }#/properties/firstName` } );
    const isValid = validate( data );

    console.error( "Errors: ", validate.errors, errors );
  } */

  return (
    <>
      <JsonFormsStyleContext.Provider value={ styleContext }>
        <JsonForms
          schema={ schema }
          uischema={ uischema }
          data={ formData }
          renderers={ renderers }
          cells={ cells }
          ajv={ ajv }
          config={{ hideRequiredAsterisk: true }}
          onChange={ ({ data, errors }) => { console.log( data, errors ) } }/>
      </JsonFormsStyleContext.Provider>
    </>
  )
}
