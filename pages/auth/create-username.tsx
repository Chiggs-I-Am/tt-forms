import CreateUsernameForm from "@components/auth/create-username-form";
import Container from "@components/layout/container";
import Layout from "@components/layout/layout";
import { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import { firestore } from "@libs/firebase/firestore";
import { authOptions } from "@pages/api/auth/[...nextauth]";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { GetServerSidePropsContext } from "next";
import { unstable_getServerSession } from "next-auth";
import { useSession } from "next-auth/react";

interface CreateUsernameProps
{
  schema: JsonSchema7;
  uischema: UISchemaElement;
}

export default function CreateUsername({ schema, uischema }: CreateUsernameProps)
{
  const { data: session } = useSession();
  const userID = session?.userID as string;
  
  return (
    <Layout>
      <Container>
        <div className="grid gap-2 w-full h-full place-items-center">        
          <CreateUsernameForm schema={ schema } uischema={ uischema } userID={ userID }/>
        </div>
      </Container>
    </Layout>
  )
}

export async function getServerSideProps({ req, res }: GetServerSidePropsContext )
{
  let userSession = await unstable_getServerSession( req, res, authOptions );

  
  if( !userSession ) {
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
      props: {}
    };
  }

  let userID = userSession?.userID as string;
  
  let usernamesCollectionRef = collection( firestore, "usernames" );
  let queryUsernameDoc = query( usernamesCollectionRef, where( "userID", "==", userID ));
  let usernameDocSnapshot = await getDocs( queryUsernameDoc );
  let isEmpty = usernameDocSnapshot.empty;
  
  // if user is signed in and has a username then redirect to home page
  if( userSession && !isEmpty ) {
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
      props: {}
    };
  }
  
  let formDocRef = doc( firestore, "forms", "create-username" );
  let formDocSnapshot = await getDoc( formDocRef );
  let formDoc = formDocSnapshot.data();

  return {
    props: {
      schema: formDoc?.schema,
      uischema: formDoc?.uischema
    }
  };
}