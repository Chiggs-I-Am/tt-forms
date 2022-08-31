import DynamicForm from "@components/form/dynamic-form";
import AppLayout from "@components/layout/app-layout";
import Container from "@components/layout/container";
import { XCircleIcon } from "@heroicons/react/solid";
import { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import { firestore } from "@libs/firebase/firestore";
import { NextPageWithLayout } from "@pages/_app";
import { DocumentData } from "firebase-admin/firestore";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { camelCase } from "lodash";
import { useSession } from "next-auth/react";
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
  const { status } = useSession();

  const checkForUser = useCallback(() => {
    if (status === "unauthenticated") {
      toast.custom((t) => (
        <div className={ `${ t.visible ? "animate-enter" : "animate-leave" } w-full max-w-xs rouned-lg shadow-lg overflow-hidden bg-error-container-light` }>
          <div className="flex gap-2 h-14 px-4 items-center">
            <XCircleIcon className="flex-none w-8 h-8 text-on-error-container-light" />
            <p className="text-sm font-medium">You have to be signed in to submit this form</p>
          </div>
        </div>
      ));
    }
  }, [ status ]);

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
  /**
   * Get document from firestore wth a query the using converted name from slug
   * @param slug - e.g "name-search-reservation"
   * converted @param slug to camelCase - e.g "nameSearchReservation"
   * get collection e.g "activities/{DOCUMENT_RETURNED_FROM_QUERY}"
   * @returns { DocumentData } - based on query
   */
  let colRef = query(
    collection(firestore, "activities"),
    orderBy(`registryForms.${ camelCase(slug) }`, "asc")
  );

  let queryDocSnapshot = await getDocs(colRef);

  let docRefPath = queryDocSnapshot.docs[0].ref.path;
  let formDocRef = doc(firestore, docRefPath, "forms", slug);
  let formDoc = await getDoc(formDocRef);

  if (formDoc.exists())
  {
    let data = formDoc.data();
    let form = {
      name: data.name,
      schema: data.schema,
      uischema: data.uischema
    };

    return {
      props: {
        form,
      }
    };
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