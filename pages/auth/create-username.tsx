import CreateUsernameForm from "@components/auth/create-username-form";
import { useAuthState } from "@components/auth/user-auth-state";
import { createUsernameSchema, createUsernameUischema } from "@components/form/schemas/create-username";
import Container from "@components/layout/container";
import Layout from "@components/layout/layout";
import { JsonSchema7, UISchemaElement } from "@jsonforms/core";

interface CreateUsernameProps
{
  schema: JsonSchema7;
  uischema: UISchemaElement;
  userID: string;
}

export default function CreateUsername()
{
  let { user } = useAuthState();

  return (
    <Layout>
      <Container>
        <div className="grid gap-2 w-full h-full place-items-center">
          {/* TODO: pull out firestore logic from form */}
          <CreateUsernameForm schema={ createUsernameSchema } uischema={ createUsernameUischema } />
        </div>
      </Container>
    </Layout>
  )
}