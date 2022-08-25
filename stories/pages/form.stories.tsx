import FormPage from "@pages/form/[slug]";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import schema from "../forms/schema.json";
import uischema from "../forms/uischema.json";

export default {
  title: "Pages/Form page",
  component: FormPage,
  parameters: {
    layout: "fullscreen",
  }
} as ComponentMeta<typeof FormPage>;

const Template: ComponentStory<typeof FormPage> = ( args ) => <FormPage { ...args } />;

export const Form = Template.bind({});
Form.args = {
  form: {
    name: "Name search reservation",
    schema: schema,
    uischema: uischema,
  }
};