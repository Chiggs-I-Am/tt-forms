import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Navbar } from "@/components/navbar";

const meta = {
  title: "components/Navbar",
  component: Navbar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
