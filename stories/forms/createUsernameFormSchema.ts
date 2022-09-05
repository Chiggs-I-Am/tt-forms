import { JsonSchema7, UISchemaElement } from "@jsonforms/core";

export const usernameFormSchema = {
  $id: "usernameForm",
  type: "object",
  properties: {
    username: {
      type: "string",
      minLength: 3,
      maxLength: 20,
      description: "Enter a username",
      errorMessage: {
        type: "Please enter a username",
        minLength: "Username must be at least 3 characters long",
        maxLength: "Username must be at most 20 characters long",
      }
    },
  },
  required: ["username"],
  errorMessage: {
    properties: {
      username: "Please enter a username",
    }
  }
} as JsonSchema7;

export const usernameFormUiSchema = { 
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      label: "Username",
      scope: "#properties.username",
    }
  ]
} as UISchemaElement;