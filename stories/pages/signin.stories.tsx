import SignIn from "@pages/auth/signin";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default 
{
  title: "Pages/SignIn",
  component: SignIn,
  parameters: {
    layout: "fullscreen",
  }
} as ComponentMeta<typeof SignIn>;

const Template: ComponentStory<typeof SignIn> = () => <SignIn />;
export const SigninPage = Template.bind({});
SigninPage.args = {};