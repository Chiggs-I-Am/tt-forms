import AuthDialog from "@components/auth-dialog";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Components/Auth-Dialog",
  component: AuthDialog,
} as ComponentMeta<typeof AuthDialog>;

const Template: ComponentStory<typeof AuthDialog> = ( args ) => <AuthDialog { ...args }/>;

export const LoginDialog = Template.bind({});
LoginDialog.args = {};