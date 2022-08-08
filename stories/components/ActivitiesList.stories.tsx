import ActivitiesList from "@components/activities-list";
import ActivityItem from "@components/activity-item";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default
{
  title: "Components/Activities-List",
  component: ActivitiesList
} as ComponentMeta<typeof ActivitiesList>;

const activities = [
  { name: "Company registry", numberOfForms: 4, imageURL: "", handleOnClick: () => console.log( "clicked" ) },
  { name: "Land registry", numberOfForms: 4, imageURL: "", handleOnClick: () => console.log( "clicked" ) },
  { name: "Civil registry", numberOfForms: 4, imageURL: "", handleOnClick: () => console.log( "clicked" ) },
];

const Template: ComponentStory<typeof ActivitiesList> = ( args ) => <ActivitiesList { ...args }/>;

export const Activities = Template.bind({});

Activities.args = {
  children: activities.map( ( activity, index ) => (
    <ActivityItem key={ index } { ...activity } />
  ))
};