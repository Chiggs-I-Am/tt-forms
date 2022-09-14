import { JsonSchema7 } from "@jsonforms/core";

export const name = "Notice of directors";

export const schema: JsonSchema7 = {
  type: "object",
  properties: {
    addDirectors: {
      type: "object",
      properties: {
        shouldAdd: {
          oneOf: [
            { const: "Yes", title: "Yes" },
            { const: "No", title: "No" }
          ]
        },
        date: {
          type: "string",
          format: "date"
        },
        director: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string"
              },
              address: {
                type: "string"
              },
              occupation: {
                type: "string"
              }
            }
          }
        }
      }
    },
    removeDirectors: {
      type: "object",
      properties: {
        shouldRemove: {
          oneOf: [
            { const: "Yes", title: "Yes" },
            { const: "No", title: "No" }
          ]
        },
        date: {
          type: "string",
          format: "date"
        },
        director: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string"
              },
              address: {
                type: "string"
              },
              occupation: {
                type: "string"
              }
            }
          }
        }
      }
    }
  }
};
export const uischema = {
  type: "Categorization",
  label: "Notice of directors",
  elements: [
    {
      type: "Category",
      label: "Would you like to add any directors?",
      elements: [
        {
          type: "Control",
          scope: "#/properties/addDirectors/properties/shouldAdd",
          options: { format: "radio" }
        },
        {
          type: "VerticalLayout",
          elements: [
            {
              type: "Control",
              label: "Notice is given on",
              scope: "#/properties/addDirectors/properties/date",
            },
            {
              type: "Control",
              scope: "#/properties/addDirectors/properties/director",
              options: { length: 7 }
            }
          ],
          rule: {
            effect: "SHOW",
            condition: {
              scope: "#/properties/addDirectors/properties/shouldAdd",
              schema: { const: "Yes" }
            }
          }
        }
      ]
    },
    {
      type: "Category",
      label: "Would you like to remove any directors?",
      elements: [
        {
          type: "Control",
          scope: "#/properties/removeDirectors/properties/shouldRemove",
          options: { format: "radio" }
        },
        {
          type: "VerticalLayout",
          elements: [
            {
              type: "Control",
              label: "Notice is given on",
              scope: "#/properties/removeDirectors/properties/date",
            },
            {
              type: "Control",
              scope: "#/properties/removeDirectors/properties/director",
              options: { length: 7 }
            }
          ],
          rule: {
            effect: "SHOW",
            condition: {
              scope: "#/properties/removeDirectors/properties/shouldRemove",
              schema: { const: "Yes" }
            }
          }
        }
      ]
    }
  ],
  options: { variant: "stepper" }
};

