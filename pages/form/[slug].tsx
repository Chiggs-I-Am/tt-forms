import DynamicForm from "@components/form/dynamic-form";
import AppToolbar from "@components/layout/app-toolbar";
import Container from "@components/layout/container";
import Layout from "@components/layout/layout";
import { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import { firestore } from "@libs/firebase/firestore";
import { DocumentData } from "firebase-admin/firestore";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { camelCase } from "lodash";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";

interface FormPageProps
{
  form: {
    name: string;
    schema: JsonSchema7;
    uischema: UISchemaElement;
  }
}

export default function FormPage({ form }: FormPageProps )
{
  const { name, schema, uischema } = form;
  const { data: session, status } = useSession();
  const router = useRouter();

  if( status === "unauthenticated" ) {
    // TODO: show popop to redirect to sign in page
    return router.push("/");
  }

  return (
    <Layout>
      <div className="grid gap-6 w-full h-full grid-rows-[auto_1fr_auto]">
        <AppToolbar>
          <h1 className="text-sm font-bold">Applying for: { name }</h1>
          <button className="" onClick={ () => signOut() }>Sign out</button>
        </AppToolbar>
        <Container>          
          <DynamicForm
            schema={ schema }
            uischema={ uischema }/>
        </Container>
      </div>
    </Layout>
  );
}

export async function getStaticProps({ params }: any )
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
    collection( firestore, "activities" ), 
    orderBy( `registryForms.${ camelCase( slug ) }`, "asc" )
  );
  
  let queryDocSnapshot = await getDocs( colRef );
  
  let docRefPath = queryDocSnapshot.docs[ 0 ].ref.path;
  let formDocRef = doc( firestore, docRefPath, "forms", slug );
  let formDoc = await getDoc( formDocRef );
  
  if( formDoc.exists() ) {
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
  let activitiesCollectionRef = collection( firestore, "activities" );
  let activitiesSnapshot = await getDocs( activitiesCollectionRef );

  let activities = activitiesSnapshot.docs.map( ( doc ) => {
    return doc.data();
  });

  let paths = activities.map( ( activity ) => {
    let { registryForms } = activity;
    
    let slug = Object.keys( registryForms ).map( key => {
      let slug = registryForms[ key ].slug;
      return { params: { slug } };
    });

    return slug;
  }).flat();

  return {
    paths,
    fallback: false,
  };
}