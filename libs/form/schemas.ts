import * as z from "zod";

const address = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
});

export const NameSearchReservationFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address,
  postalAddress: z.object({
    hasPostalAddress: z.enum(["Yes", "No"]).default("No"),
    address: z.optional(address),
  }),
  proposedBusinessName: z.string().min(1, "Business name is required"),
  alternativeBusinessNames: z.optional(
    z.array(
      z.string().min(1, "Business name is required")
    ).min(1)
  ),
});

export const AppointmentFormSchema = z.object({
  registry: z.string().min(1, "Please select a department"),
  location: z.string().min(1, "Please select a location"),
  date: z.date({
    required_error: "Please select a date",
  }),
  time: z.string().min(1, "Please select a time"),
});

export const ContactFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(3, "Please enter a message"),
});