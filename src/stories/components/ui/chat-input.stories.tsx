import { ChatInput } from "@/components/ui/chat-input";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Components/Chat Input",
  component: ChatInput,
  tags: ["autodocs"],
} satisfies Meta<typeof ChatInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSendMessage: (message: string) => {
      console.log("Message sent:", message);
    },
    placeholder: "Type a message...",
    disabled: false,
    maxLength: 200,
  },
  render: function Render(args) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <ChatInput {...args} />
      </div>
    );
  },
};
