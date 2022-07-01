import FormInput from "@components/form-input";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { screen, userEvent } from "@storybook/testing-library";
import { ChangeEvent, useCallback, useState } from "react";

export default {
  title: "Components/Form-Input",
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

Input.play = async () => {
  const nameInput = screen.getByLabelText("Name", { selector: "input" });

  await userEvent.type( nameInput, "Stephan Wilson", { delay: 250 } );
};