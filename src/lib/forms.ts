import type { FormStep } from "@/components/ui/conversational-form";
import { z } from "zod";

export interface Form {
	id: string;
	name: string;
	description: string;
	steps: FormStep[];
	formSchema: z.ZodObject<Record<string, z.ZodTypeAny>>; // More specific type for ZodObject
}

const contactInformationSchema = z.object({
	name: z.string().min(2, "Please enter your full name (at least 2 characters)"),
	email: z.string().email("Please enter a valid email address"),
	phone: z.string().optional().refine((value) => {
		if (value && value.replace(/\D/g, "").length < 10) {
			return false;
		}
		return true;
	}, "Please enter a valid phone number"),
});

const userRegistrationSchema = z.object({
	username: z
		.string()
		.min(3, "Username must be at least 3 characters")
		.max(20, "Username must be 20 characters or less")
		.regex(/^[a-zA-Z0-9]+$/, "Username can only contain letters and numbers"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Password must include an uppercase letter")
		.regex(/[a-z]/, "Password must include a lowercase letter")
		.regex(/\d/, "Password must include a number"),
});

export const forms: Form[] = [
	{
		id: "contact-information",
		name: "Contact Information",
		description: "A simple form to collect contact information.",
		formSchema: contactInformationSchema,
		steps: [
			{
				id: "name",
				title: "Personal Information",
				description: "Tell us about yourself",
				question: "What's your full name?",
				type: "text",
				required: true,
				
			},
			{
				id: "email",
				title: "Contact Information",
				description: "How can we reach you?",
				question: "What's your email address?",
				type: "email",
				required: true,
				
			},
			{
				id: "phone",
				title: "Phone Number",
				description: "Alternative contact method",
				question: "What's your phone number?",
				type: "text",
				required: false,
				
			},
		],
	},
	{
		id: "user-registration",
		name: "User Registration",
		description: "A form to register new users.",
		formSchema: userRegistrationSchema,
		steps: [
			{
				id: "username",
				title: "Username",
				description: "Choose a username",
				question: "Choose a username (3-20 characters, letters and numbers only):",
				type: "text",
				required: true,
				
			},
			{
				id: "password",
				title: "Password",
				description: "Create a secure password",
				question: "Create a password (minimum 8 characters, must include uppercase, lowercase, and number):",
				type: "text",
				required: true,
				
			},
		],
	},
];