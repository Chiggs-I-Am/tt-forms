import CreateUsernameForm from "@components/auth/create-username-form";
import Container from "@components/layout/container";
import Layout from "@components/layout/layout";
import { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import { GetServerSidePropsContext } from "next";
import { useSession } from "next-auth/react";
import { usernameFormSchema, usernameFormUiSchema } from "stories/forms/createUsernameFormSchema";

interface CreateUsernameProps
{
  schema: JsonSchema7;
  uischema: UISchemaElement;
}

export default function CreateUsername({ schema, uischema }: CreateUsernameProps)
{
  const { data: session } = useSession();
  
  return (
    <Layout>
      <Container>
        <div className="grid gap-2 w-full h-full place-items-center">        
          <CreateUsernameForm schema={ usernameFormSchema } uischema={ usernameFormUiSchema } user={ session?.userID }/>
        </div>
      </Container>
    </Layout>
  )
}

export async function getServerSideProps({ req, res }: GetServerSidePropsContext )
{
  // const schemaDocRef = firestoreAdmin.collection( "forms" ).doc( "create_username" );
  // const schemaDoc = await schemaDocRef.get();
  // const schema = schemaDoc.data();
  

  return {
    props: {}
  };
}