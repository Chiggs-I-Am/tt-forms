import ActivityFormList from "@components/activity-form-list";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default
{
  title: "Components/Activities Form List",
  component: ActivityFormList,
} as ComponentMeta<typeof ActivityFormList>

const Template: ComponentStory<typeof ActivityFormList> = ( args ) => <ActivityFormList { ...args } />;

export const FormList = Template.bind({});
FormList.args = {
  forms: [
    {
      name: "Name search reservation",
      fee: 25,
      slug: "name-search-reservation",
    },
    {
      name: "Notice of Directors",
      fee: 15,
      slug: "notice-of-directors",
    },
  ]
};
