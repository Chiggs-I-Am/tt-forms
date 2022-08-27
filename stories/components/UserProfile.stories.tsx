import UserProfile from "@components/user/user-profile";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Components/User Profile",
  component: UserProfile,
  args: {
    name: "Stephan Wilson",
    email: "stephanthedev@gmail.com",
    image: "https://picsum.photos/60"
  }
} as ComponentMeta<typeof UserProfile>;

const Template: ComponentStory<typeof UserProfile> = ( args ) => <UserProfile { ...args } />;

export const UserProfileCard = Template.bind({});
UserProfileCard.args = {};