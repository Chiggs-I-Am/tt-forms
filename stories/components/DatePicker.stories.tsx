import DatePicker from "@components/form/date-picker";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Components",
  component: DatePicker,
} as ComponentMeta<typeof DatePicker>;

const Template: ComponentStory<typeof DatePicker> = ( args ) => <DatePicker { ...args } />;

export const FormDatePicker = Template.bind({});
FormDatePicker.args = {
  minDate: "2018-01-01",
  maxDate: "2022-12-31",
  label: "Select a date"
};