import AuthCard from "@components/auth/auth-card";
import Container from "@components/layout/container";
import Layout from "@components/layout/layout";
import { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import { authOptions } from "@pages/api/auth/[...nextauth]";
import { GetServerSidePropsContext } from "next";
import { unstable_getServerSession } from "next-auth";
import { signIn } from "next-auth/react";

interface SigninProps
{
  schema: JsonSchema7;
  uischema: UISchemaElement;
}

export default function Signin({ schema, uischema }: SigninProps ) 
{
  return (
    <Layout>
      <Container>
        <div className="grid w-full h-full place-items-center">
          <AuthCard 
            handleProviderSignIn={ ( provider ) => signIn( provider ) }
            handleEmailSignIn={ ( email ) => signIn( "email", { email } ) }/>
        </div>
      </Container>
    </Layout>
  )
}

export async function getServerSideProps( context: GetServerSidePropsContext )
{
  let session = await unstable_getServerSession( context.req, context.res, authOptions );

  if( session ) {
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
      props: {}
    }
  }

  return {
    props: { }
  }
}