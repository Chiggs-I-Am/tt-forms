import Home from "@pages/index";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { SessionProvider } from "next-auth/react";

export default {
  title: "Pages/Home",
  component: Home,
  parameters: {
    layout: "fullscreen",
  }
} as ComponentMeta<typeof Home>;

const Template: ComponentStory<typeof Home> = ( args: any ) => (
  <SessionProvider session={ args.session }>
    <Home { ...args }/>
  </SessionProvider>
);

export const HomePage = Template.bind({});
HomePage.args = {};