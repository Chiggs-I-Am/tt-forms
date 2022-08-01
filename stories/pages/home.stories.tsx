import Home from "@pages/index";
import { ComponentMeta, ComponentStory } from "@storybook/react";

// eslint-disable-next-line import/no-anonymous-default-export
export default
{
  title: "Pages/Home",
  component: Home
} as ComponentMeta<typeof Home>;

const Template: ComponentStory<typeof Home> = ( args: any ) => <Home { ...args }/>;

export const HomePage = Template.bind({});
HomePage.args = {
  forms: [
    { 
      slug: "name-search-reservation", 
      number: 25, 
      name: "Name Search Reservation"
    },
    {
      slug: "notice-of-directors",
      number: 4,
      name: "Notice of Directors"
    },
    {
      slug: "notice-of-address",
      number: 5,
      name: "Notice of Address"
    },
    {
      slug: "articles-of-incorporation",
      number: 6,
      name: "Articles of Incorporation"
    }
  ]
};