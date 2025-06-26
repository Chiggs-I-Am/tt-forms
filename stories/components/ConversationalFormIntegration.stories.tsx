import DynamicForm from "@components/form/dynamic-form";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import schema from "../forms/schema.json";
import conversationalUiSchema from "../forms/conversational-uischema.json";

export default {
  title: "Components/Dynamic-Form/Conversational Form Integration",
  component: DynamicForm,
  parameters: {
    layout: "fullscreen",
  }
} as ComponentMeta<typeof DynamicForm>;

const Template: ComponentStory<typeof DynamicForm> = (args) => <DynamicForm {...args} />;

export const ConversationalForm = Template.bind({});
ConversationalForm.args = {
  schema: schema,
  uischema: conversationalUiSchema
};

export const ConversationalFormWithInitialData = Template.bind({});
ConversationalFormWithInitialData.args = {
  schema: schema,
  uischema: conversationalUiSchema,
  // Note: DynamicForm doesn't accept initial data directly, but this shows the structure
};

// Simple form example
const simpleSchema = {
  $id: "simpleContactForm",
  type: "object",
  properties: {
    name: {
      type: "string",
      minLength: 2,
      description: "Please enter your full name"
    },
    email: {
      type: "string",
      format: "email",
      description: "Please enter your email address"
    },
    message: {
      type: "string",
      minLength: 10,
      description: "Please enter your message"
    }
  },
  required: ["name", "email", "message"]
};

const simpleConversationalUiSchema = {
  type: "Categorization",
  elements: [
    {
      type: "Category",
      label: "Your Information",
      elements: [
        {
          type: "Control",
          label: "Full Name",
          scope: "#/properties/name"
        },
        {
          type: "Control",
          label: "Email Address",
          scope: "#/properties/email"
        }
      ]
    },
    {
      type: "Category",
      label: "Your Message",
      elements: [
        {
          type: "Control",
          label: "Message",
          scope: "#/properties/message"
        }
      ]
    }
  ],
  options: {
    variant: "conversational"
  }
};

export const SimpleContactForm = Template.bind({});
SimpleContactForm.args = {
  schema: simpleSchema,
  uischema: simpleConversationalUiSchema
};