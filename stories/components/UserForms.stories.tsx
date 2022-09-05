import UserForms from "@components/user/user-forms";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Components/User Forms",
  component: UserForms
} as ComponentMeta<typeof UserForms>;

const Template: ComponentStory<typeof UserForms> = ( args ) => <UserForms { ...args } />;

export const UserForm = Template.bind({});
UserForm.args = {
  forms: [
    {
      name: "Name search reservation",
      createdAt: "Thurs 25th Aug",
      updatedAt: "Thurs 25th Aug",
      status: "Pending Approval",
      formData: {
        nameSearchReservation: {}
      }
    },
    {
      name: "Name search reservation",
      createdAt: "Thurs 25th Aug",
      updatedAt: "Thurs 25th Aug",
      status: "Pending Approval",
      formData: {
        nameSearchReservation: {}
      }
    },
    {
      name: "Name search reservation",
      createdAt: "Thurs 25th Aug",
      updatedAt: "Thurs 25th Aug",
      status: "Pending Approval",
      formData: {
        nameSearchReservation: {}
      }
    },
  ]
};