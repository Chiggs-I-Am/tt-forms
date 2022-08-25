import RadioGroupControl, { RadioGroupControlTester } from "@components/form/radio-group-control";
import SelectControl, { SelectControlTester } from "@components/form/select-control";
import StepperLayout, { StepperLayoutTester } from "@components/form/stepper-layout";
import TextInputControl, { TextInputControlTester } from "@components/form/text-input";

import { createAjv, JsonSchema7, UISchemaElement } from "@jsonforms/core";
import { JsonForms } from "@jsonforms/react";
import { JsonFormsStyleContext, useStyles, vanillaCells, vanillaRenderers } from "@jsonforms/vanilla-renderers";

import ArraryControlRenderer, { ArrayControlRendererTester } from "@components/form/arrary-control-renderer";
import { firestore } from "@libs/firebase/firestore";
import useJoinClassNames from "@utils/joinClasses";
import ajvErrors from "ajv-errors";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { kebabCase } from "lodash";
import { useSession } from "next-auth/react";
import { createContext, useCallback, useEffect, useState } from 'react';
import PreviewForm from "./preview-form";

interface DynamicFormProps
{
  schema: JsonSchema7;
  uischema: UISchemaElement;
}

interface ShowPreviewContextProps
{
  showPreview: boolean;
  setShowPreview: ( showPreview: boolean ) => void;
}

interface SectionIndexContextProps
{
  sectionIndex: number | undefined;
  setSectionIndex: ( sectionIndex: number | undefined ) => void;
}

export const ShowPreviewContext = createContext( {} as ShowPreviewContextProps );
export const SelectedIndexContext = createContext( {} as SectionIndexContextProps );

export default function DynamicForm({ schema, uischema }: DynamicFormProps )
{
  const [ formData, setFormData ] = useState<{} | null>(null);
  
  const joinClassNames = useJoinClassNames();
  const styles = useStyles();
  
  const [ showPreview, setShowPreview ] = useState( false );
  const [ isValid, setIsValid ] = useState( false );

  const [ sectionIndex, setSectionIndex ] = useState<number | undefined>();

  const { data: session } = useSession();
  
  const renderers = [
    ...vanillaRenderers,
    { tester: StepperLayoutTester, renderer: StepperLayout },
    { tester: TextInputControlTester, renderer: TextInputControl },
    { tester: RadioGroupControlTester, renderer: RadioGroupControl },
    { tester: SelectControlTester, renderer: SelectControl },
    { tester: ArrayControlRendererTester, renderer: ArraryControlRenderer },
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

  const validateFormData = useCallback(( data: any ) => {
    const validate = ajv.compile( schema );
    const isValid = validate( data );

    setIsValid( isValid );
  }, [ ajv, schema ]);

  useEffect( () => {  
    if( formData ) validateFormData( formData );

  }, [ formData, validateFormData ] );

  const onChange = useCallback( ( data: any ) => {
    setFormData( data );
  }, []);

  const gotoSection = useCallback( ( index: number ) => {
    setSectionIndex( index );
  }, []);

  const userID = session?.userID as string;

  const onSubmitForm = async () => {
    let data = {
      formData,
      status: "Pending Approval",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ticketNumber: "NSR-00001" // save a ticket number based on form e.g. Name Search Reservation = NSR-12345
    };

    let formName = schema.$id as string;
    
    try { 
      let userDocRef = doc( firestore, "users", userID, "forms", kebabCase(formName) );
      await setDoc( userDocRef, data, { merge: true } );
      
      setShowPreview( false );
      // show document created success
      // toast.success("Form submitted!")
      
      // redirect to home page
      // router.push("/");
    }
    catch( error: any ) {
      alert( error.message );
    }
  };

  return (
    <>
      <SelectedIndexContext.Provider value={{ sectionIndex, setSectionIndex }}>
        <ShowPreviewContext.Provider value={{ showPreview, setShowPreview }}>
          <JsonFormsStyleContext.Provider value={ styleContext }>
            <JsonForms
              schema={ schema }
              uischema={ uischema }
              data={ formData }
              renderers={ renderers }
              cells={ cells }
              ajv={ ajv }
              config={{ hideRequiredAsterisk: true }}
              onChange={ ({ data, errors }) => { onChange( data ) }}/>
          </JsonFormsStyleContext.Provider>
        </ShowPreviewContext.Provider>
      </SelectedIndexContext.Provider>

      { 
        isValid && showPreview ? (
          <PreviewForm 
            open={ showPreview }
            title={ schema.$id }
            description="Review your data and submit"
            formData={ formData }
            gotoSection={ gotoSection }
            submitForm={ onSubmitForm }
            onCloseDialog={ () => {
              setShowPreview( false );
            }}/>
        ) : null 
      }
    </>
  )
}
