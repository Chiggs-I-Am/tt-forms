import Button from "@components/button";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default
{
  title: "Components/Button",
  component: Button,
  argTypes: { role: { control: "select", options: [ "primary", "secondary", "tertiary", "error" ] } }
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = ( args ) => ( <Button { ...args } /> );

export const Primary = Template.bind({});

Primary.args = {
  buttonText: "Primary",
  role: "primary",
  onClick: () => { console.log("Primary button clicked"); }
};