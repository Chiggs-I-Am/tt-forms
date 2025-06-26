import Container from "@components/layout/container";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Components/Layout/Container",
  component: Container,
  parameters: {
    layout: "fullscreen",
  },
} as ComponentMeta<typeof Container>;

const Template: ComponentStory<typeof Container> = (args) => (
  <Container {...args} />
);

export const Default = Template.bind({});
Default.args = {
  children: (
    <div className="bg-primary-container-light dark:bg-primary-container-dark p-8 rounded-lg">
      <h2 className="text-xl font-semibold text-on-primary-container-light dark:text-on-primary-container-dark mb-4">
        Container Component
      </h2>
      <p className="text-on-primary-container-light dark:text-on-primary-container-dark">
        This container component provides consistent max-width and centering for content.
        It follows the shadcn design system patterns with responsive behavior.
      </p>
    </div>
  )
};

export const WithMultipleElements = Template.bind({});
WithMultipleElements.args = {
  children: (
    <div className="space-y-6">
      <div className="bg-secondary-container-light dark:bg-secondary-container-dark p-6 rounded-lg">
        <h3 className="text-lg font-medium text-on-secondary-container-light dark:text-on-secondary-container-dark">
          Card 1
        </h3>
        <p className="text-on-secondary-container-light dark:text-on-secondary-container-dark">
          First card content
        </p>
      </div>
      <div className="bg-tertiary-container-light dark:bg-tertiary-container-dark p-6 rounded-lg">
        <h3 className="text-lg font-medium text-on-tertiary-container-light dark:text-on-tertiary-container-dark">
          Card 2
        </h3>
        <p className="text-on-tertiary-container-light dark:text-on-tertiary-container-dark">
          Second card content
        </p>
      </div>
    </div>
  )
};