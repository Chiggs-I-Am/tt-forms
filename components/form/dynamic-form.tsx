import RadioGroupControl, { RadioGroupControlTester } from "@components/form/radio-group-control";
import SelectControl, { SelectControlTester } from "@components/form/select-control";
import StepperLayout, { StepperLayoutTester } from "@components/form/stepper-layout";
import TextInputControl, { TextInputControlTester } from "@components/form/text-input";

import { createAjv, JsonSchema7, UISchemaElement } from "@jsonforms/core";
import { JsonForms } from "@jsonforms/react";
import { JsonFormsStyleContext, useStyles, vanillaCells, vanillaRenderers } from "@jsonforms/vanilla-renderers";

import { useAuthState } from "@components/auth/user-auth-state";
import ArraryControlRenderer, { ArrayControlRendererTester } from "@components/form/arrary-control-renderer";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/solid";
import { getFirebase } from "@libs/firebase/firebaseApp";
import { firestore } from "@libs/firebase/firestore";
import useJoinClassNames from "@utils/joinClasses";
import ajvErrors from "ajv-errors";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { kebabCase } from "lodash";
import { useRouter } from "next/router";
import { createContext, useCallback, useEffect, useState } from 'react';
import toast from "react-hot-toast";
import useSWR from "swr";
import DatePickerControl, { DatePickerControlTester } from "./date-picker-control";
import FormArrayControl, { FormArrayControlTester } from "./form-array-control";
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

async function getUsername( endpoint: string ) {
  let { auth } = getFirebase();
  
  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ uid: auth.currentUser?.uid })
  };

  let response = await fetch( endpoint, options );
  return response.json();
}

export default function DynamicForm({ schema, uischema }: DynamicFormProps )
{
  const [ formData, setFormData ] = useState<{} | null>(null);

  const router = useRouter();
  
  const joinClassNames = useJoinClassNames();
  const styles = useStyles();
  
  const [ showPreview, setShowPreview ] = useState( false );
  const [ isValid, setIsValid ] = useState( false );

  const [ sectionIndex, setSectionIndex ] = useState<number | undefined>();

  const { user } = useAuthState();
  const { data, error } = useSWR( user ? "/api/user/username" : null, getUsername );
  
  const renderers = [
    ...vanillaRenderers,
    { tester: StepperLayoutTester, renderer: StepperLayout },
    { tester: TextInputControlTester, renderer: TextInputControl },
    { tester: RadioGroupControlTester, renderer: RadioGroupControl },
    { tester: SelectControlTester, renderer: SelectControl },
    { tester: ArrayControlRendererTester, renderer: ArraryControlRenderer },
    { tester: DatePickerControlTester, renderer: DatePickerControl },
    { tester: FormArrayControlTester, renderer: FormArrayControl },
  ];

  const cells = [
    ...vanillaCells
  ];

  const styleContext = { styles: [
    ...styles,
    {
      name: "control",
      classNames: [ joinClassNames( "grid" ) ]
    },
  ]};

  const ajv = ajvErrors( createAjv({ useDefaults: true }) );

  const validateFormData = useCallback(( data: any ) => {
    const validate = ajv.compile( schema );
    const isValid = validate( data );
    const errors = validate.errors?.map( error => error );
    console.log( errors ?? "no errors" );
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

  const onSubmitForm = async () => {
    if( !user ) {
      // show toast -> you need to be signed in to submit this form
      toast.custom((t) => (
        <div className={ `${ t.visible ? "animate-enter" : "animate-leave" } w-full max-w-xs rouned-lg shadow-lg overflow-hidden bg-error-container-light` }>
          <div className="flex gap-2 h-14 px-4 items-center justify-center">
            <XCircleIcon className="w-8 h-8 text-on-error-container-light" />
            <p className="text-sm font-medium">You have to be signed in to submit this form</p>
          </div>
        </div>
      ));
      return
    }

    if( !isValid ) {
      toast.custom((t) => (
        <div className={ `${ t.visible ? "animate-enter" : "animate-leave" } w-full max-w-xs rouned-lg shadow-lg overflow-hidden bg-error-container-light` }>
          <div className="flex gap-2 h-14 px-4 items-center justify-center">
            <XCircleIcon className="w-8 h-8 text-on-error-container-light" />
            <p className="text-sm font-medium">Please fix all errors before submitting</p>
          </div>
        </div>
      ));

      setShowPreview( false );

      return
    }
    
    let userFormData = {
      formData,
      status: "Pending Approval",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ticketNumber: "NSR-00001", // save a ticket number based on form e.g. Name Search Reservation = NSR-12345
      username: data?.username
    };

    let formName = schema.$id as string;
    
    try { 
      let userDocRef = doc( firestore, "users", user.uid, "forms", kebabCase(formName) );
      await setDoc( userDocRef, userFormData, { merge: true } );
      
      toast.custom((t) => (
        <div className={ `${ t.visible ? "animate-enter" : "animate-leave" } w-full max-w-xs rouned-lg shadow-lg overflow-hidden bg-secondary-container-light` }>
          <div className="flex gap-2 h-14 px-4 items-center">
            <CheckCircleIcon className="flex-none w-8 h-8 text-green-500" />
            <p className="text-sm font-medium">Form submitted</p>
          </div>
        </div>
      ));
      
      // redirect to home page
      router.push("/");
    }
    catch( error: any ) {
      console.log( error.message );
    }

    setShowPreview( false );
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
