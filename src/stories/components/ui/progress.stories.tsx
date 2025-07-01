import { Progress } from "@/components/ui/progress";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Components/Progress",
  component: Progress,
  tags: ["autodocs"],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 50,
    max: 100,
    className: "w-full max-w-md mx-auto",
  },
  render: function Render(args) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <Progress {...args} />
      </div>
    );
  },
};

export const Complete: Story = {
  args: {
    value: 100,
    max: 100,
    className: "w-full max-w-md mx-auto",
  },
  render: function Render(args) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <Progress {...args} />
      </div>
    );
  },
};

export const Indeterminate: Story = {
  args: {
    value: undefined,
    max: 100,
    className: "w-full max-w-md mx-auto",
  },
  render: function Render(args) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <Progress {...args} />
      </div>
    );
  },
};
