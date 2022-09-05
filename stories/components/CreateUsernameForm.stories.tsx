import CreateUsernameForm from "@components/auth/create-username-form";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { usernameFormSchema, usernameFormUiSchema } from "../forms/createUsernameFormSchema";

export default {
  title: "Components/Username Form",
  component: CreateUsernameForm,
} as ComponentMeta<typeof CreateUsernameForm>;

const Template: ComponentStory<typeof CreateUsernameForm> = (args) => <CreateUsernameForm {...args} />;

export const UsernameForm = Template.bind({});
UsernameForm.args = {
  schema: usernameFormSchema,
  uischema: usernameFormUiSchema
};