import FormSelect from "@components/form-select";
import { expect } from "@storybook/jest";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { screen, userEvent } from "@storybook/testing-library";

export default
{
  title: "Components/Dynamic-Form/Select-Autocomplete",
  component: FormSelect,
} as ComponentMeta<typeof FormSelect>;

const state = ["Arima","San Fernando","Princes Town","Piarco","Rio Claro","Port of Spain","Victoria","Maraval","Fyzabad","Debe","Couva","Diego Martin","Chaguanas","Penal","Cunupia","Curepe","Roxborough","San Juan","Arouca","Saint Joseph","California","Marabella","Siparia","Gasparillo","Morvant","Barataria","Saint Clair","Laventille","Carenage","Ward of Tacarigua","Caroni","Lopinot","Tunapuna","Santa Cruz","Saint Augustine","Golden Lane","Scarborough","Moriah","Saint James","Carapichaima","Valsayn","Freeport","Claxton Bay","Sangre Grande","Cumuto","Woodbrook","Petit Valley","El Dorado","Phoenix Park"];

const options = state.map( option => ({ value: option, label: option }));

const Template: ComponentStory<typeof FormSelect> = ( args ) => ( <div className="max-w-sm"><FormSelect { ...args } /></div> );

export const Select = Template.bind({});
Select.args = {
  options,
  label: "State / Province",
  onChange: ( value ) => { if( value ) console.log( "onChange", value ); }
};

export const UserInteractiveSelect = Template.bind({});
UserInteractiveSelect.args = {
  ...Select.args,
};

UserInteractiveSelect.play = async function interactiveTests() {
  const autoCompleteInput = screen.getByRole("combobox");
  const selectButton = screen.getByRole("button");

  await userEvent.click( selectButton );

  await userEvent.keyboard( "{ArrowDown>8}", { delay: 250 });

  await userEvent.type( autoCompleteInput, "SanJyan", { delay: 300 } );

  await userEvent.clear( autoCompleteInput );

  await userEvent.type( autoCompleteInput, "San Ju", { delay: 500 } );

  await userEvent.keyboard( "{Enter}", { delay: 500 });

  await expect( autoCompleteInput ).toHaveValue( "San Juan" );
};