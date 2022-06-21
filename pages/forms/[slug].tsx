import Container from "@components/container";
import Layout from "@components/layout";
import { JsonForms } from "@jsonforms/react";
import { vanillaRenderers } from "@jsonforms/vanilla-renderers";
import { createFirebaseApp } from "@libs/firebase";
import { collection, doc, DocumentData, getDoc, getDocs, getFirestore } from "firebase/firestore";
import { useState } from "react";

export default function TTForm({ form }: any )
{
  const [ formData, setFormData ] = useState( null );
  const { schema, uischema, name } = form;

  const renderers = [
    ...vanillaRenderers
  ];

  return (
    <Layout>
      <Container>
        <div>
          <h1>{ name }</h1>

          <JsonForms
            schema={ schema }
            uischema={ uischema }
            data={ formData }
            renderers={ renderers }/>
            
        </div>
      </Container>
    </Layout>
  );
}

export async function getStaticProps({ params }: any )
{
  let { slug } = params;
  
  let app = createFirebaseApp();
  let firestore = getFirestore( app );

  let formsCollection = collection( firestore, "forms" );
  let formDocRef = doc( formsCollection, slug );

  let formDocSnapshot = await getDoc( formDocRef );
  let form = formDocSnapshot.data();
  
  return {
    props: { form },
  };
}

export async function getStaticPaths()
{
  let app = createFirebaseApp();
  let firestore = getFirestore( app );

  let formsCollection = collection( firestore, "forms" );
  let formsDocSnapshot = await getDocs( formsCollection );

  let paths = formsDocSnapshot.docs.map( ( doc: DocumentData ) => {
    let { slug } = doc.data();
    return { params: { slug } };
  });

  console.log( paths );

  return {
    paths,
    fallback: false,
  };
}