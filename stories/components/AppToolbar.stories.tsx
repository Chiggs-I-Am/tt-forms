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
  },
  args: {
    hasSession: { user: { email: "user@domain.com" }},
  }
} as ComponentMeta<typeof AppToolbar>;

const Template: ComponentStory<typeof AppToolbar> = (args) => <AppToolbar {...args} />;

const session: boolean = false;
export const Toolbar = Template.bind({});
Toolbar.args = {
  children: (
    <>
    { !session ? 
        <div>
          <button className="text-sm font-medium h-10 px-6 rounded-full shadow-md bg-primary-light text-on-primary-light">Login</button>
        </div>
        :
        <div>
          <h1>{ `User: user@domain.com` }</h1>
        </div>
    }
  </>)
};