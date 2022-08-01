import DynamicForm from "@components/dynamic-form";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import schema from "../forms/schema.json";
import uischema from "../forms/uischema.json";

export default
{
  title: "Components/Dynamic-Form",
  component: DynamicForm,
  parameters: {
    layout: "fullscreen",
  }
} as ComponentMeta<typeof DynamicForm>

const Template: ComponentStory<typeof DynamicForm> = ( args ) => <DynamicForm { ...args } />;

export const Form = Template.bind({});
Form.args = {
  schema: schema,
  uischema: uischema
};  