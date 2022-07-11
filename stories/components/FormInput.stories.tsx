import FormInput from "@components/form-input";
import { expect } from "@storybook/jest";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { screen, userEvent } from "@storybook/testing-library";
import { ChangeEvent, useCallback, useState } from "react";

export default {
  title: "Components/Dynamic-Form/Form-Input",
  component: FormInput
} as ComponentMeta<typeof FormInput>;

const Template: ComponentStory<typeof FormInput> = ( args ) => {
  const [ value, setValue ] = useState( args.value );

  const handleChange = useCallback( ( event: ChangeEvent<HTMLInputElement> ) => {
    let { value } = event.target;
    setValue( value );
  }, []);

  return (
    <div className="relative max-w-sm min-h-[80px]">
      <FormInput 
        { ...args }
        value={ value }
        updateValue={ ( event ) => handleChange( event ) }/>
    </div>
  )
};

export const Input = Template.bind({});
Input.args = {
  id: "name-input",
  name: "name",
  label: "Name",
  value: "",
  enabled: true,
  required: true,
};

export const UserInteractiveInput = Template.bind({});
UserInteractiveInput.args = {
  ...Input.args,
};

UserInteractiveInput.play = async () => {
  const nameInput = screen.getByLabelText("Name", { selector: "input" });

  await userEvent.type( nameInput, "Stephan Wilson", { delay: 250 } );

  expect( nameInput ).toHaveValue("Stephan Wilson");
};