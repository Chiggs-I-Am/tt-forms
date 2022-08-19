import CreateUsername from "@pages/auth/create-username";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { SessionProvider } from "next-auth/react";

export default {
  title: "Pages/Create Username",
  component: CreateUsername,
  parameters: {
    layout: "fullscreen",
  }
} as ComponentMeta<typeof CreateUsername>;

const Template: ComponentStory<typeof CreateUsername> = ( args: any ) => (
  <SessionProvider session={ args.session }>
    <CreateUsername { ...args }/>
  </SessionProvider>
);

export const CreateUsernamePage = Template.bind({});
CreateUsernamePage.args = {};