import AppToolbar from "@components/layout/app-toolbar";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default 
{
  title: "Components/App Toolbar",
  component: AppToolbar,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    signedIn: { control: "boolean" },
  }
} as ComponentMeta<typeof AppToolbar>;

const Template: ComponentStory<typeof AppToolbar> = (args) => <AppToolbar {...args} />;

export const ToolbarWithSignedInUser = Template.bind({});
ToolbarWithSignedInUser.args = {
  userSession: {
    user: {
      name: "Stephan Wilson",
      email: "stephanthedev@gmail.com",
      image: "path-to-image",
    },
    expires: Date.now().toString()
  }
};

export const Toolbar = Template.bind({});
Toolbar.args = {};