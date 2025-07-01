import { ConversationalForm } from "@/components/ui/conversational-form";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

const steps = [
  {
    id: "name",
    title: "Name",
    question: "What is your name?",
    type: "text" as const,
  },
  {
    id: "email",
    title: "Email",
    question: "What is your email?",
    type: "email" as const,
  },
];

const meta = {
  title: "Components/Conversational Form",
  component: ConversationalForm,
  tags: ["autodocs"],
} satisfies Meta<typeof ConversationalForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    steps,
    formSchema,
    onComplete: (values: Record<string, string>) => {
      console.log("Form submitted:", values);
    },
  },
  render: function Render(args) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <ConversationalForm {...args} />
      </div>
    );
  },
};
