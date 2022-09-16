import { useAuthState } from "@components/auth/user-auth-state";
import DynamicForm from "@components/form/dynamic-form";
import AppLayout from "@components/layout/app-layout";
import Container from "@components/layout/container";
import { XCircleIcon } from "@heroicons/react/solid";
import { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import { firestore } from "@libs/firebase/firestore";
import { NextPageWithLayout } from "@pages/_app";
import { collection, getDocs } from "firebase/firestore";
import { useCallback, useEffect } from "react";
import toast from "react-hot-toast";

interface FormPageProps
{
  form: {
    name: string;
    schema: JsonSchema7;
    uischema: UISchemaElement;
  }
}

const FormPage:NextPageWithLayout<FormPageProps> = ({ form }: FormPageProps) => {
  const { name, schema, uischema } = form;
  const { user } = useAuthState();

  const checkForUser = useCallback(() => {
    if ( !user ) {
      toast.custom((t) => (
        <div className={ `${ t.visible ? "animate-enter" : "animate-leave" } w-full max-w-xs rouned-lg shadow-lg overflow-hidden bg-error-container-light` }>
          <div className="flex gap-2 h-14 px-4 items-center">
            <XCircleIcon className="flex-none w-8 h-8 text-on-error-container-light" />
            <p className="text-sm font-medium">You have to be signed in to submit this form</p>
          </div>
        </div>
      ), { id: "noUser"});
    }
  }, [ user ]);

  useEffect( () => {
    checkForUser();
  }, [ checkForUser ]);

  return (
    <Container>
      <DynamicForm
        schema={ schema }
        uischema={ uischema } />
    </Container>
  );
}

FormPage.Layout = AppLayout

export default FormPage;

export async function getStaticProps({ params }: any)
{
  let { slug } = params;

  const formData = ( await import(`@components/form/schemas/${slug}`) );
  
  const form = {
    name: formData.name,
    schema: formData.schema,
    uischema: formData.uischema
  };

  return {
    props: {
      form
    }
  }
}

export async function getStaticPaths()
{
  let activitiesCollectionRef = collection(firestore, "activities");
  let activitiesSnapshot = await getDocs(activitiesCollectionRef);

  let activities = activitiesSnapshot.docs.map((doc) =>
  {
    return doc.data();
  });

  let paths = activities.map((activity) =>
  {
    let { registryForms } = activity;

    let slug = Object.keys(registryForms).map(key =>
    {
      let slug = registryForms[key].slug;
      return { params: { slug } };
    });

    return slug;
  }).flat();

  return {
    paths,
    fallback: false,
  };
}