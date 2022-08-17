import SignIn from "@pages/auth/signIn";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default 
{
  title: "Pages/SignIn",
  component: SignIn,
  args: {
    providers: {
      email: {
        name: "Email",
        id: "email"
      },
      google: {
        name: "Google",
        id: "google"
      },
      facebook: {
        name: "Facebook",
        id: "facebook"
      },
      twitter: {
        name: "Twitter",
        id: "twitter"
      }
    }
  },
  parameters: {
    layout: "fullscreen",
  }
} as ComponentMeta<typeof SignIn>;

const Template: ComponentStory<typeof SignIn> = ( args ) => <SignIn { ...args } />;
export const SigninPage = Template.bind({});
SigninPage.args = {};