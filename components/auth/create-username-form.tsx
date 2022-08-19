import TextInputControl, { TextInputControlTester } from "@components/form/text-input";
import { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import { JsonForms } from "@jsonforms/react";
import { vanillaRenderers } from "@jsonforms/vanilla-renderers";
import { firestore } from "@libs/firebase/firestore";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { useRouter } from "next/router";
import { useCallback, useDeferredValue, useEffect, useState } from "react";

interface CreateUsernameFormProps
{
  schema: JsonSchema7;
  uischema: UISchemaElement;
  user: unknown;
}

export default function CreateUsernameForm({ schema, uischema, user }: CreateUsernameFormProps) 
{
  const [ formData, setFormData ] = useState<string>("");

  const [ isUsernameValid, setIsUsernameValid ] = useState( false );
  const [loading, setLoading] = useState( false );
  const userID = user as string;

  const router = useRouter();

  const usernameFormData = useDeferredValue( formData );

  const renderers = [
    ...vanillaRenderers,
    { tester: TextInputControlTester, renderer: TextInputControl },
  ];

  const checkIfUsernameExists = useCallback( async (username: string) =>
  {
    /* const response = await fetch( `/api/users/${username}` );
    const data = await response.json();
    return data.exists; */
    let userDocRef = doc( firestore, "users", username );
    let userDoc = await getDoc( userDocRef );
    let exists = userDoc.exists();

    setIsUsernameValid( exists );
    setLoading( false );
  }, []);

  useEffect(() =>
  {
    if ( usernameFormData ) {
      checkIfUsernameExists( usernameFormData );
    }
  }, [ usernameFormData, checkIfUsernameExists ]);

  const handleOnSubmit = useCallback(async () => {
    let username = formData;

    let batch = writeBatch(firestore);

    try
    {
      let userDocRef = doc(firestore, "users", userID );
      batch.update( userDocRef, { 
        username: username,
      });

      let usernameDocRef = doc(firestore, "usernames", username );
      batch.set( usernameDocRef, { userID });
      alert( "Username created" );
      
      await batch.commit();

      // show user created successfully
      // toast.success("User created successfully");

      router.push("/");
    }
    catch (error: any)
    {
      console.log( `${error}` );
    }

  }, [ formData, userID, router ]);

  function validateUsername( username: string )
  {
    let name = username.toLowerCase();
    const reg = /^(?=[a-zA-Z0-9._]{3,20}$)(?!.*[_.]{2})[^_.].*[^_.]$/;

    if ( name.length < 3 ) {
      setFormData( username );
      setLoading( false );
      setIsUsernameValid( false );
    }

    if ( reg.test( name ) )
    {
      setFormData( username );
      setLoading( true );
      setIsUsernameValid( false );
    }
  }

  return (
    <div className="w-full max-w-sm bg-primary-container-light rounded-2xl shadow-xl overflow-hidden">
      <div className="grid gap-3 grid-flow-row w-full px-4 py-8">
        <div>
          <h3 className="text-sm font-medium text-on-primary-container-light">Create a username to continue</h3>
        </div>
        <div className="flex w-full items-center">  
          <div className="w-full">
            <JsonForms
            schema={ schema }
            uischema={ uischema }
            data={ formData }
            renderers={ renderers }
            validationMode="NoValidation"
            onChange={ ({ data, errors }) => validateUsername( data ) } />
          </div>
        </div>

        <button
          disabled={ !isUsernameValid }
          onClick={ handleOnSubmit }
          className="w-full h-10 px-6 rounded-full shadow-md text-sm font-medium bg-primary-light text-on-primary-light disabled:bg-surface-light disabled:text-on-surface-light">
          Create Username
        </button>

      </div>
    </div>
  )
}
