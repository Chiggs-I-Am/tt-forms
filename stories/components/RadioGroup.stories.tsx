import RadioButtonGroup from "@components/form/radio-button-group";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default
{
  title: "Components/Dynamic-Form",
  component: RadioButtonGroup,
} as ComponentMeta<typeof RadioButtonGroup>;

const Template: ComponentStory<typeof RadioButtonGroup> = ( args ) => <RadioButtonGroup { ...args } />;

export const RadioGroup = Template.bind({});
RadioGroup.args = {
  options: [
    { label: "Yes", value: "Yes" },
    { label: "No", value: "No" },
  ],
  onChange: ( value ) => {  },
};