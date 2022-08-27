import UsernamePage from "@pages/[username]/dashboard";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Pages/User Dashboard",
  component: UsernamePage,
  parameters: {
    layout: "fullscreen"
  },
  args: {
    userSession: {
      user: {
        name: "Stephan Wilson",
        email: "email@domain.com",
        image: "path-to-image",
      },
      expires: Date.now().toString()
    }
  }
} as ComponentMeta<typeof UsernamePage>;

const Template: ComponentStory<typeof UsernamePage> = ( args ) => <UsernamePage { ...args } />;

export const UserDashboard = Template.bind({});
UserDashboard.args = {};