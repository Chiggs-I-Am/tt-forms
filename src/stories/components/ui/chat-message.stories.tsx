import { ChatMessage } from "@/components/ui/chat-message";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Components/Chat Message",
  component: ChatMessage,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ChatMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UserMessage: Story = {
  args: {
    content: "Hello, this is a user message!",
    type: "user",
    timestamp: new Date("2025-07-01T10:00:00Z"),
  },
  render: function Render(args) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <ChatMessage {...args} />
      </div>
    );
  },
};

export const BotMessage: Story = {
  args: {
    content: "Hi! How can I help you today?",
    type: "bot",
    timestamp: new Date("2025-07-01T10:01:00Z"),
  },
  render: function Render(args) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <ChatMessage {...args} />
      </div>
    );
  },
};
