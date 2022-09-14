import { JsonSchema7 } from "@jsonforms/core";
import { firestore } from "@libs/firebase/firestore";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export const name = "Name search reservation";

const province = [
	"Chaguanas",
	"Couva",
	"Diego Martin",
	"Mayaro",
	"Penal",
	"Princes Town",
	"Point Fortin",
	"Port of Spain",
];

export const schema: JsonSchema7 = {
	$id: "nameSearchReservation",
	type: "object",
	properties: {
		name: {
			type: "object",
			properties: {
				firstName: {
					type: "string",
					minLength: 3,
					description: "Please enter your first name",
					errorMessage: {
						type: "First name is required",
						minLength: "First name must be at least 3 characters",
					},
				},
				lastName: {
					type: "string",
					minLength: 3,
					description: "Please enter your last name",
					errorMessage: {
						type: "Last name is required",
						minLength: "Last name must be at least 3 characters",
					},
				},
			},
		},
		address: {
			type: "object",
			properties: {
				street: {
					type: "string",
					minLength: 3,
					description: "Please enter your street",
					errorMessage: {
						type: "Street is required",
						minLength: "Street name must be at least 3 characters",
					},
				},
				city: {
					type: "string",
					minLength: 3,
					description: "Please enter your city",
					errorMessage: {
						type: "City is required",
						minLength: "City name must be at least 3 characters",
					},
				},
				state: {
					type: "string",
					enum: province,
					description: "Please select a state or province",
					errorMessage: {
						type: "Please select a state or province",
					},
				},
			},
		},
		postalAddress: {
			type: "object",
			properties: {
				hasPostalAddress: {
					oneOf: [
						{ const: "Yes", title: "Yes I do" },
						{ const: "No", title: "No I don't" },
					],
				},
				street: {
					type: "string",
					minLength: 3,
					description: "Please enter your street",
					errorMessage: {
						type: "Street name is required",
						minLength: "Street name must be at least 3 characters",
					},
				},
				city: {
					type: "string",
					minLength: 3,
					description: "Please enter your city",
					errorMessage: {
						type: "City name is required",
						minLength: "City name must be at least 3 characters",
					},
				},
				state: {
					type: "string",
					enum: province,
					description: "Please select a state or province",
					errorMessage: {
						type: "Please select a state or province",
					},
				},
			},
		},
		phoneNumber: { type: "string" },
		businessDetails: {
			type: "object",
			properties: {
				proposedName: {
					type: "string",
					minLength: 3,
					description: "Please enter a proposed business name",
				},
				alternativeNames: {
					type: "array",
					items: {
						type: "object",
						properties: {
							name: {
								type: "string",
								minLength: 3,
								description: "Please enter an alternative business name",
							},
						},
					},
				},
			},
		},
	},
	required: ["name", "address", "businessDetails"],
	errorMessage: {
		properties: {
			firstName: "Please enter your first name",
			lastName: "Please enter your last name",
		},
	},
};
export const uischema = {
	type: "Categorization",
	label: "Name search reservation",
	elements: [
		{
			type: "Category",
			label: "Please enter your full name",
			elements: [
				{
					type: "Control",
					label: "First name",
					scope: "#/properties/name/properties/firstName",
				},
				{
					type: "Control",
					label: "Last name",
					scope: "#/properties/name/properties/lastName",
				},
			],
		},
		{
			type: "Category",
			label: "Where do you currently live?",
			elements: [
				{
					type: "Control",
					label: "Street",
					scope: "#/properties/address/properties/street",
				},
				{
					type: "Control",
					label: "City",
					scope: "#/properties/address/properties/city",
				},
				{
					type: "Control",
					label: "State / Province",
					scope: "#/properties/address/properties/state",
				},
			],
		},
		{
			type: "Category",
			label: "Do you have a postal address?",
			elements: [
				{
					type: "Control",
					scope: "#/properties/postalAddress/properties/hasPostalAddress",
					options: { format: "radio" },
				},
				{
					type: "VerticalLayout",
					elements: [
						{
							type: "Control",
							label: "Street",
							scope: "#/properties/postalAddress/properties/street",
						},
						{
							type: "Control",
							label: "City",
							scope: "#/properties/postalAddress/properties/street",
						},
						{
							type: "Control",
							label: "State / Province",
							scope: "#/properties/postalAddress/properties/state",
						},
					],
					rule: {
						effect: "SHOW",
						condition: {
							scope: "#/properties/postalAddress/properties/hasPostalAddress",
							schema: { const: "Yes" }
						}
					}
				}
			]
		},
    {
      type: "Category",
      label: "What number can we use to reach you?",
      elements: [
        {
          type: "Control",
          label: "Enter your phone number",
          scope: "#/properties/phoneNumber"
        }
      ]
    },
    {
      type: "Category",
      label: "What name do you want to reserve?",
      elements: [
        {
          type: "Control",
          label: "Proposed business name",
          scope: "#/properties/businessDetails/properties/proposedName"
        },
        {
          type: "Control",
          scope: "#/properties/businessDetails/properties/alternativeNames",
					options: { format: "array-input" }
        }
      ]
    }
	],
  options: { variant: "stepper" }
};