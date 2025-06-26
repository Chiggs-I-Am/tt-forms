import ProgressIndicator from "@components/form/progress-indicator";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Components/Dynamic-Form/Progress Indicator",
  component: ProgressIndicator,
  parameters: {
    layout: "centered",
  },
} as ComponentMeta<typeof ProgressIndicator>;

const Template: ComponentStory<typeof ProgressIndicator> = (args) => (
  <div className="w-96">
    <ProgressIndicator {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  currentStep: 2,
  totalSteps: 5,
  steps: [
    { label: "Personal Info", completed: true, current: false },
    { label: "Address", completed: false, current: true },
    { label: "Contact", completed: false, current: false },
    { label: "Business Details", completed: false, current: false },
    { label: "Review", completed: false, current: false },
  ],
};

export const FirstStep = Template.bind({});
FirstStep.args = {
  currentStep: 1,
  totalSteps: 5,
  steps: [
    { label: "Personal Info", completed: false, current: true },
    { label: "Address", completed: false, current: false },
    { label: "Contact", completed: false, current: false },
    { label: "Business Details", completed: false, current: false },
    { label: "Review", completed: false, current: false },
  ],
};

export const LastStep = Template.bind({});
LastStep.args = {
  currentStep: 5,
  totalSteps: 5,
  steps: [
    { label: "Personal Info", completed: true, current: false },
    { label: "Address", completed: true, current: false },
    { label: "Contact", completed: true, current: false },
    { label: "Business Details", completed: true, current: false },
    { label: "Review", completed: false, current: true },
  ],
};

export const AllCompleted = Template.bind({});
AllCompleted.args = {
  currentStep: 5,
  totalSteps: 5,
  steps: [
    { label: "Personal Info", completed: true, current: false },
    { label: "Address", completed: true, current: false },
    { label: "Contact", completed: true, current: false },
    { label: "Business Details", completed: true, current: false },
    { label: "Review", completed: true, current: false },
  ],
};