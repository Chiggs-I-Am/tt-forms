import FormPage from "@pages/form/[slug]";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { SessionProvider } from "next-auth/react";
import schema from "../forms/schema.json";
import uischema from "../forms/uischema.json";

export default {
  title: "Pages/Form page",
  component: FormPage,
  parameters: {
    layout: "fullscreen",
  }
} as ComponentMeta<typeof FormPage>;

let session = {
  user: {
    name: "Stephan Wilson",
    email: "email@domain.com",
    image: "path-to-image",
  },
  expires: Date.now().toString()
}

const Template: ComponentStory<typeof FormPage> = ( args ) => (
  <SessionProvider session={ session }>
    <FormPage { ...args } />
  </SessionProvider>
);

export const Form = Template.bind({});
Form.args = {
  form: {
    name: "Name search reservation",
    schema: schema,
    uischema: uischema,
  }
};