import ActivityItem from "@components/activity-item";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default
{
  title: "Components/Activities-List",
  component: ActivityItem
} as ComponentMeta<typeof ActivityItem>;

const activityItem = {
  slug: "name-search-reservation",
  number: 25,
  name: "Name Search / Reservation",
  activities: ["Incorporation of a Profit", "Incorporation of a Non-Profit"],
  fee: 25
};

const Template: ComponentStory<typeof ActivityItem> = ( args ) => <ActivityItem { ...args } />;

export const Activity = Template.bind({});
Activity.args = { ...activityItem };