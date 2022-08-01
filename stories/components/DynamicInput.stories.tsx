import DynamicInput from "@components/dynamic-input";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default
{
  title: "Components/Dynamic-Form",
  component: DynamicInput,
  parameters: {
    actions: [ "mouseup", "button" ]
  },
} as ComponentMeta<typeof DynamicInput>;

const Template: ComponentStory<typeof DynamicInput> = ( args ) => ( 
  <div>
    <DynamicInput { ...args } />
  </div>
);

export const InputWithDelete = Template.bind({});

InputWithDelete.args = {
  data: "",
  id: "",
  name: "",
  label: "",
  required: false,
  enabled: true,
  updateValue: ( value ) => { console.log( value ) },
  handleRemoveItem: () => { },
};
