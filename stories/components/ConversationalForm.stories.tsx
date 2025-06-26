import ConversationalForm from "@components/form/conversational-form";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { SelectedIndexContext, ShowPreviewContext } from "@components/form/dynamic-form";
import { useState } from "react";
import schema from "../forms/schema.json";

// Create a conversational variant of the UI schema
const conversationalUiSchema = {
  type: "Categorization",
  elements: [
    {
      type: "Category",
      label: "Personal Information",
      elements: [
        {
          type: "Control",
          label: "First name",
          scope: "#/properties/name/properties/firstName"
        },
        {
          type: "Control",
          label: "Last name",
          scope: "#/properties/name/properties/lastName"
        }
      ]
    },
    {
      type: "Category",
      label: "Address Details",
      elements: [
        {
          type: "Control",
          label: "Street",
          scope: "#/properties/address/properties/street"
        },
        {
          type: "Control",
          label: "City",
          scope: "#/properties/address/properties/city"
        },
        {
          type: "Control",
          label: "State / Province",
          scope: "#/properties/address/properties/state"
        },
        {
          type: "Control",
          label: "Zip code",
          scope: "#/properties/address/properties/zip"
        }
      ]
    },
    {
      type: "Category",
      label: "Contact Information",
      elements: [
        {
          type: "Control",
          label: "Phone Number",
          scope: "#/properties/phoneNumber"
        }
      ]
    }
  ],
  options: { 
    variant: "conversational",
    showNavButtons: true
  }
} as any;

export default {
  title: "Components/Dynamic-Form/Conversational Form",
  component: ConversationalForm,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      const [showPreview, setShowPreview] = useState(false);
      const [sectionIndex, setSectionIndex] = useState<number | undefined>(0);

      return (
        <ShowPreviewContext.Provider value={{ showPreview, setShowPreview }}>
          <SelectedIndexContext.Provider value={{ sectionIndex, setSectionIndex }}>
            <div className="h-screen">
              <Story />
            </div>
          </SelectedIndexContext.Provider>
        </ShowPreviewContext.Provider>
      );
    },
  ],
} as ComponentMeta<typeof ConversationalForm>;

const Template: ComponentStory<typeof ConversationalForm> = (args) => (
  <ConversationalForm {...args} />
);

export const Default = Template.bind({});
Default.args = {
  schema: schema,
  uischema: conversationalUiSchema,
  data: {},
  path: "",
};

export const WithInitialData = Template.bind({});
WithInitialData.args = {
  schema: schema,
  uischema: conversationalUiSchema,
  data: {
    name: {
      firstName: "John",
      lastName: "Doe"
    },
    address: {
      street: "123 Main St",
      city: "Anytown"
    }
  },
  path: "",
};

export const ShortForm = Template.bind({});
ShortForm.args = {
  schema: {
    $id: "simpleForm",
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Please enter your name"
      },
      email: {
        type: "string",
        format: "email",
        description: "Please enter your email"
      }
    },
    required: ["name", "email"]
  },
  uischema: {
    type: "Categorization",
    elements: [
      {
        type: "Category",
        label: "Basic Info",
        elements: [
          {
            type: "Control",
            label: "Name",
            scope: "#/properties/name"
          },
          {
            type: "Control", 
            label: "Email",
            scope: "#/properties/email"
          }
        ]
      }
    ],
    options: { 
      variant: "conversational"
    }
  } as any,
  data: {},
  path: "",
};