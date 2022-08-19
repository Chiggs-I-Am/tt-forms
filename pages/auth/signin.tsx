import AuthCard from "@components/auth/auth-card";
import Container from "@components/layout/container";
import Layout from "@components/layout/layout";
import { JsonSchema7, UISchemaElement } from "@jsonforms/core";

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
          <AuthCard />
        </div>
      </Container>
    </Layout>
  )
}

export async function getStaticProps()
{
  return {
    props: { }
  }
}