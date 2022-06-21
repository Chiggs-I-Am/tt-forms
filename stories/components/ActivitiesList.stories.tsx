import ActivitiesList from "@components/activities-list";
import ActivityItem from "@components/activity-item";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default
{
  title: "Components/Activities-List",
  component: ActivitiesList
} as ComponentMeta<typeof ActivitiesList>;

const activities = [
  { 
    id: "incorporation-of-profit",
    title: "Incorporation of a Profit", 
    forms: [
      { slug: "name-search-reservation", name: "Name Search / Reservation", number: 25, fee: 25 },
      { slug: "notice-of-directors", name: "Notice of Directors", number: 25, fee: 25 },
      { slug: "notice-of-address", name: "Notice of Address", number: 25, fee: 25 },
      { slug: "articles-of-incorporation", name: "Articles of Incorporation", number: 25, fee: 25 },
    ]
  },
  { 
    id: "incorporation-of-non-profit",
    title: "Incorporation of a Non-Profit", 
    forms: [
      { slug: "name-search-reservation", name: "Name Search / Reservation", number: 25, fee: 25 },
      { slug: "notice-of-directors", name: "Notice of Directors", number: 25, fee: 25 },
      { slug: "notice-of-address", name: "Notice of Address", number: 25, fee: 25 },
      { slug: "articles-of-incorporation", name: "Articles of Incorporation", number: 25, fee: 25 },
    ]
  },
];

const forms = activities.map( activity => activity.forms );
const activity = forms.flat();

const Template: ComponentStory<typeof ActivitiesList> = ( args ) => <ActivitiesList { ...args }/>;

export const Activities = Template.bind({});

Activities.args = {
  children: activity.map( ( form, index ) => (
    <ActivityItem key={ index } { ...form } />
  ))
};