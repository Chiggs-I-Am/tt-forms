import ActivityItem from "@components/activity-item";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default
{
  title: "Components/Activities-List",
  component: ActivityItem
} as ComponentMeta<typeof ActivityItem>;

const activityItemData = {
  numberOfForms: 4,
  name: "Company registry",
  imageURL: "business.jpg",
  handleOnClick: () => console.log( "clicked" ),
};

const Template: ComponentStory<typeof ActivityItem> = ( args ) => (
  <div className="grid w-full place-items-center">
    <ActivityItem { ...args } />
  </div>
);

export const Activity = Template.bind({});
Activity.args = { ...activityItemData };