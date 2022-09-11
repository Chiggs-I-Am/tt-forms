import TextInputControl, { TextInputControlTester } from "@components/form/text-input";
import { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import { vanillaRenderers } from "@jsonforms/vanilla-renderers";
import { firestore } from "@libs/firebase/firestore";
import { addDoc, collection, doc, getDoc, writeBatch } from "firebase/firestore";
import { useRouter } from "next/router";
import { ChangeEvent, useCallback, useDeferredValue, useEffect, useId, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuthState } from "./user-auth-state";

interface CreateUsernameFormProps
{
  schema: JsonSchema7;
  uischema: UISchemaElement;
}

export default function CreateUsernameForm({ schema, uischema }: CreateUsernameFormProps) 
{
  const [formData, setFormData] = useState<string>("");

  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef( null );
  const id = useId();
  const [inputValue, setInputValue] = useState("");

  const router = useRouter();

  const usernameFormData = useDeferredValue(formData);
  const { user } = useAuthState();

  const renderers = [
    ...vanillaRenderers,
    { tester: TextInputControlTester, renderer: TextInputControl },
  ];

  const checkIfUsernameExists = useCallback(async (username: string) =>
  {
    try
    {
      let userDocRef = doc(firestore, "usernames", username.toLowerCase());
      let userDoc = await getDoc(userDocRef);
      let exists = userDoc.exists();

      setIsUsernameValid(!exists);
      setLoading(false);
    }
    catch (error: any)
    {
      // show toast: error creating username
    }
  }, []);

  useEffect(() =>
  {
    if (usernameFormData.length >= 3) checkIfUsernameExists(usernameFormData);
  }, [usernameFormData, checkIfUsernameExists]);

  const handleOnSubmit = useCallback(async () =>
  {
    let username = formData;

    let batch = writeBatch(firestore);

    try
    {
      let usersCollectionRef = collection( firestore, "users" );
      let usernamesCollectionRef = collection( firestore, "usernames" );
      
      await addDoc( usersCollectionRef, {
        displayName: user?.displayName, 
        email: user?.email, 
        emailVerified: user?.emailVerified,
        photoURL: user?.photoURL,
        uid: user?.uid,
        username
      });
      await addDoc( usernamesCollectionRef, { userID: user?.uid! });

      // show user created successfully
      toast.success("Username created successfully");

      router.push("/");
    }
    catch (error: any)
    {
      console.log(`${ error }`);
    }

  }, [formData, router, user ]);

  function validateUsername(username: string)
  {
    const reg = /^(?=[a-zA-Z0-9._]{3,20}$)(?!.*[_.]{2})[^_.].*[^_.]$/;

    if (username.length < 3)
    {
      setFormData(username);
      setLoading(false);
      setIsUsernameValid(false);
    }

    if (reg.test(username))
    {
      setFormData(username);
      setLoading(true);
      setIsUsernameValid(prev => prev);
    }
  }

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    let { value } = event.target;
    validateUsername( value );
    setInputValue(value);
  }, []);

  return (
    <div className="w-full max-w-sm dark:bg-primary-dark bg-primary-container-light rounded-2xl shadow-xl overflow-hidden">
      <div className="grid gap-8 grid-flow-row w-full px-4 py-8">
        <div>
          <h3 className="text-sm font-semibold dark:text-on-primary-dark text-on-primary-container-light">Create a username to continue</h3>
        </div>

        <div className="flex w-full items-center">
          <div className="relative w-full">
            <input
              ref={ inputRef }
              id={ `${ id }-input` }
              type="text"
              name="email"
              placeholder="Enter value"
              value={ inputValue }
              onChange={ handleChange }
              className="peer h-14 w-full
                border border-outline-dark
                rounded-[4px]
                text-sm dark:text-on-primary-dark 
                placeholder-transparent
                bg-inherit
                focus:outline-none focus:border-2 focus:border-primary-container-dark"/>
            <label className="absolute left-2 -top-5 text-xs dark:text-on-primary-dark text-on-primary-light peer-focus:font-semibold">Email</label>
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
