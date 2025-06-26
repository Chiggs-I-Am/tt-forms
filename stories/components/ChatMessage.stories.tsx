import ChatMessage from "@components/form/chat-message";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Components/Dynamic-Form/Chat Message",
  component: ChatMessage,
  parameters: {
    layout: "centered",
  },
} as ComponentMeta<typeof ChatMessage>;

const Template: ComponentStory<typeof ChatMessage> = (args) => (
  <div className="w-96 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
    <ChatMessage {...args} />
  </div>
);

export const BotMessage = Template.bind({});
BotMessage.args = {
  type: "bot",
  content: "Hello! I'll help you complete your form. Let's start with the first section.",
  timestamp: new Date(),
};

export const UserMessage = Template.bind({});
UserMessage.args = {
  type: "user",
  content: "Sure, I'm ready to get started!",
  timestamp: new Date(),
};

export const LongBotMessage = Template.bind({});
LongBotMessage.args = {
  type: "bot",
  content: "Great! For the next section, I'll need some information about your address. Please provide your street address, city, state, and zip code. This information will be used for official correspondence.",
  timestamp: new Date(),
};

export const LongUserMessage = Template.bind({});
LongUserMessage.args = {
  type: "user",
  content: "I live at 123 Main Street, Anytown, California, and my zip code is 12345. I've been living there for about 5 years now.",
  timestamp: new Date(),
};

export const TypingMessage = Template.bind({});
TypingMessage.args = {
  type: "bot",
  content: "",
  isTyping: true,
};

export const MessageWithoutTimestamp = Template.bind({});
MessageWithoutTimestamp.args = {
  type: "bot",
  content: "This message doesn't have a timestamp.",
};

// Conversation Example
const ConversationTemplate: ComponentStory<typeof ChatMessage> = () => (
  <div className="w-96 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-4">
    <ChatMessage
      type="bot"
      content="Hello! I'll help you complete your Name Search Reservation form."
      timestamp={new Date(Date.now() - 300000)}
    />
    <ChatMessage
      type="user"
      content="Great! I'm ready to start."
      timestamp={new Date(Date.now() - 240000)}
    />
    <ChatMessage
      type="bot"
      content="Perfect! Let's begin with your personal information. What's your first and last name?"
      timestamp={new Date(Date.now() - 180000)}
    />
    <ChatMessage
      type="user"
      content="My name is John Doe."
      timestamp={new Date(Date.now() - 120000)}
    />
    <ChatMessage
      type="bot"
      content="Thank you, John! Now let's move on to your address information."
      timestamp={new Date(Date.now() - 60000)}
    />
    <ChatMessage
      type="bot"
      content=""
      isTyping={true}
    />
  </div>
);

export const ConversationExample = ConversationTemplate.bind({});
ConversationExample.args = {};