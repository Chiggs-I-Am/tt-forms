import CreateUsername from "@pages/auth/create-username";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { SessionProvider } from "next-auth/react";
import { usernameFormSchema, usernameFormUiSchema } from "stories/forms/createUsernameFormSchema";

export default {
  title: "Pages/Create Username",
  component: CreateUsername,
  parameters: {
    layout: "fullscreen",
  }
} as ComponentMeta<typeof CreateUsername>;

const session = {
  user: {
    name: "Stephan Wilson",
    email: "stephanthedev@gmail.com",
    image: "path-to-image",
  },
  expires: Date.now().toString()
};

const Template: ComponentStory<typeof CreateUsername> = ( args: any ) => (
  <SessionProvider session={ session }>
    <CreateUsername { ...args }/>
  </SessionProvider>
);

export const CreateUsernamePage = Template.bind({});
CreateUsernamePage.args = {
  schema: usernameFormSchema,
  uischema: usernameFormUiSchema
};