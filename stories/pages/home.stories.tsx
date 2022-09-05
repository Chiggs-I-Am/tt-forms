import Home from "@pages/index";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { SessionProvider } from "next-auth/react";

export default {
  title: "Pages/Home",
  component: Home,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    userSession: {
      user: {
        name: "Stephan Wilson",
        email: "email@domain.com",
        image: "path-to-image",
      },
      expires: Date.now().toString(),
    }
  }
} as ComponentMeta<typeof Home>;

const Template: ComponentStory<typeof Home> = ( args: any ) => (
  <SessionProvider session={ args.userSession }>
    <Home { ...args }/>
  </SessionProvider>
);

const activities = [
  {
    name: "Company registry",
    imageURL: "",
    registryForms: {
      nameSearchReservation: {
        name: "Name search reservation",
        fee: 25,
        slug: "name-search-reservation"
      }
    }
  },
  {
    name: "Company registry",
    imageURL: "",
    registryForms: {
      nameSearchReservation: {
        name: "Name search reservation",
        fee: 25,
        slug: "name-search-reservation"
      }
    }
  },
  {
    name: "Company registry",
    imageURL: "",
    registryForms: {
      nameSearchReservation: {
        name: "Name search reservation",
        fee: 25,
        slug: "name-search-reservation"
      }
    }
  },
];

export const HomePage = Template.bind({});
HomePage.args = {
  activities
};