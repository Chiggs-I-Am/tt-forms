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
  activities: [
    { 
      forms: [
        { name: "Name search reservation", fee: 25, slug: "name-search-reservation" },
        { name: "Notice of Directors", fee: 15, slug: "notice-of-directors" },
      ], 
      name: "Company registry",
      imageURL: "https://picsum.photos/200",
    },
    {
      forms: [
        { name: "Name search reservation", fee: 25, slug: "name-search-reservation" },
        { name: "Notice of Directors", fee: 15, slug: "notice-of-directors" },
        { name: "Name search reservation", fee: 25, slug: "name-search-reservation" },
      ],
      name: "Land registry",
      imageURL: "https://picsum.photos/200",
    },
    {
      forms: [
        { name: "Name search reservation", fee: 25, slug: "name-search-reservation" },
      ],
      name: "Civil registry",
      imageURL: "https://picsum.photos/200",
    },
  ]
};