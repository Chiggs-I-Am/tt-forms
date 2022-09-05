import VerifyRequest from "@pages/auth/verify-request";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Pages/Verify request",
  component: VerifyRequest,
  parameters: {
    layout: "fullscreen",
  }
} as ComponentMeta<typeof VerifyRequest>;

const Template: ComponentStory<typeof VerifyRequest> = ( args ) => <VerifyRequest />;

export const VerifyRequestPage = Template.bind({});
VerifyRequestPage.args = {};