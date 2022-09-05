import AuthCard from "@components/auth/auth-card";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Components/Auth-Card",
  component: AuthCard,
} as ComponentMeta<typeof AuthCard>;

const Template: ComponentStory<typeof AuthCard> = ( args ) => <AuthCard { ...args }/>;

export const LoginDialog = Template.bind({});
LoginDialog.args = {};