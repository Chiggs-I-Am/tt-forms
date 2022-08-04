import PreviewForm from "@components/preview-form";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Components/Dynamic-Form/Review Form Info",
  component: PreviewForm,
} as ComponentMeta<typeof PreviewForm>;

const Template: ComponentStory<typeof PreviewForm> = ( args ) => <PreviewForm { ...args } />;

export const ReviewFormDialog = Template.bind({});

ReviewFormDialog.args = {
  open: true,
  description: "Review your info before you submit.",
  title: "Name Search Reservation",
  formData: {
    name: {
      firstName: "Stephan",
      lastName: "Wilson",
    },
    address: {
      street: "Isles street",
      city: "Enterprise",
      state: "Chaguanas",
      zip: 12345,
    },
    phoneNumber: "123-456-7890",
    postalAddress: { hasPostalAddress: "No" },
    businessDetails: {
      proposedName: "Tetromaddz Gaming",
      alternativeNames: [
        { value: "Nerd Boy Tech" },
        { value: "Stark Tech" }
      ]
    }
  }
};