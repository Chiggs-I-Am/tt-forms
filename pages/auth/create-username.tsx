import CreateUsernameForm from "@components/auth/create-username-form";
import { useAuthState } from "@components/auth/user-auth-state";
import Container from "@components/layout/container";
import Layout from "@components/layout/layout";
import { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import { firestore } from "@libs/firebase/firestore";
import { doc, getDoc } from "firebase/firestore";

interface CreateUsernameProps
{
  schema: JsonSchema7;
  uischema: UISchemaElement;
  userID: string;
}

export default function CreateUsername({ schema, uischema }: CreateUsernameProps)
{
  let { user } = useAuthState();

  return (
    <Layout>
      <Container>
        <div className="grid gap-2 w-full h-full place-items-center">
          {/* TODO: pull out firestore logic from form */}
          <CreateUsernameForm schema={ schema } uischema={ uischema } userID={ `${ user?.uid }` }/>
        </div>
      </Container>
    </Layout>
  )
}

export async function getStaticProps()
{
  /* let usernamesCollectionRef = collection( firestore, "usernames" );
  let queryUsernameDoc = query( usernamesCollectionRef, where( "userID", "==", `${ currentUser?.uid }` ));
  let usernameDocSnapshot = await getDocs( queryUsernameDoc );
  let isEmpty = usernameDocSnapshot.empty; */
  
  // if user is signed in and has a username then redirect to home page
  /* if( currentUser && !isEmpty ) {
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
      props: {}
    };
  } */
  
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