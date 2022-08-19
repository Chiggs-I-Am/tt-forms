import DynamicForm from "@components/form/dynamic-form";
import Container from "@components/layout/container";
import Layout from "@components/layout/layout";
import { initializeFirebaseApp } from "@libs/firebase/firebaseApp";
import { collection, doc, DocumentData, getDoc, getDocs, getFirestore } from "firebase/firestore";

export default function FormPage({ form }: any )
{
  const { schema, uischema, name } = form;

  return (
    <Layout>
      <Container>
        <div>
          <h1>{ name }</h1>

          <DynamicForm
            schema={ schema }
            uischema={ uischema }/>

        </div>
      </Container>
    </Layout>
  );
}

export async function getStaticProps({ params }: any )
{
  let { slug } = params;
  
  let app = initializeFirebaseApp();
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
  let app = initializeFirebaseApp();
  let firestore = getFirestore( app );

  let formsCollection = collection( firestore, "forms" );
  let formsDocSnapshot = await getDocs( formsCollection );

  let paths = formsDocSnapshot.docs.map( ( doc: DocumentData ) => {
    let { slug } = doc.data();
    return { params: { slug } };
  });

  return {
    paths,
    fallback: false,
  };
}