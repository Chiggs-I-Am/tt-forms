import DynamicForm from "@components/form/dynamic-form";
import { expect } from "@storybook/jest";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { screen, userEvent } from "@storybook/testing-library";
import schema from "../forms/schema.json";
import uischema from "../forms/uischema.json";

export default
{
  title: "Components/Dynamic-Form",
  component: DynamicForm,
  parameters: {
    layout: "fullscreen",
  }
} as ComponentMeta<typeof DynamicForm>

const Template: ComponentStory<typeof DynamicForm> = ( args ) => <DynamicForm { ...args } />;

export const Form = Template.bind({});
Form.args = {
  schema: schema,
  uischema: uischema
};

export const UserInteractiveForm = Template.bind({});

UserInteractiveForm.args = { ...Form.args };

UserInteractiveForm.play = async () => {
  const firstNameInput = screen.getByLabelText("First name", { selector: "input" });
  const lastNameInput = screen.getByLabelText("Last name", { selector: "input" });
  
  
  const nextButton = screen.getByText( "Next" );
  
  // Interact with name section
  await userEvent.type( firstNameInput, "Stephan", { delay: 250 } );
  await userEvent.type( lastNameInput, "Wilson", { delay: 500 } );
  await userEvent.click( nextButton );
  
  // Interact with address section
  interactiveTimer( addressInputs )
    .then( async () => {
      await userEvent.click( nextButton );
    });

  // Interact with postal address section
  // interactiveTimer( postalAdressInputs );

  expect( firstNameInput ).toHaveValue( "Stephan" );
  expect( lastNameInput ).toHaveValue( "Wilson" );
};

function interactiveTimer( fn: Function, delay: number = 1000 ) {
  
  return new Promise( ( resolve ) => {
    setTimeout( async () => {
      await fn();
      resolve( true );
    }, delay );
  });
}

async function addressInputs()
{
  const street = screen.getByLabelText("Street", { selector: "input" });
  const city = screen.getByLabelText("City", { selector: "input" });
  const state = screen.getByRole( "combobox" );
  const zip = screen.getByLabelText("Zip code", { selector: "input" });

  await userEvent.type(street, "123 Main St", { delay: 250 });
  await userEvent.type(city, "Anytown", { delay: 500 });
  await userEvent.type(state, "ch", { delay: 250 });
  await userEvent.keyboard("{Enter}", { delay: 250 });
  await userEvent.type(zip, "12345", { delay: 250 });
}

async function postalAdressInputs()
{
  
}
