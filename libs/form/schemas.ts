import * as z from "zod";

const address = z.object( {
  street: z.string().min( 1, "Street is required" ),
  city: z.string().min( 1, "City is required" ),
  state: z.string().min( 1, "State is required" ),
} );

const postalAddress = z.object( {
  hasPostalAddress: z.enum( ["Yes", "No"], { required_error: "Please select an option" } ),
  street: z.string().min( 3, "Street name must be at least 3 characters" ).or( z.literal( "" ) ),
  city: z.string().min( 3, "City name must be at least 3 characters" ).or( z.literal( "" ) ),
  state: z.string().or( z.literal( "" ) ),
} ).superRefine( ( values, ctx ) =>
{
  const hasNoStreet = !values.street;
  const hasNoCity = values.city === "" || !values.city;
  const hasNoState = values.state === "" || !values.state;

  if ( values.hasPostalAddress === "Yes" && hasNoStreet )
  {
    ctx.addIssue( {
      code: z.ZodIssueCode.custom,
      message: "Please enter a street name",
      path: ["street"],
    } );
  }

  if ( values.hasPostalAddress === "Yes" && hasNoCity )
  {
    ctx.addIssue( {
      code: z.ZodIssueCode.custom,
      message: "Please enter a city name",
      path: ["city"],
    } );
  }

  if ( values.hasPostalAddress === "Yes" && hasNoState )
  {
    ctx.addIssue( {
      code: z.ZodIssueCode.custom,
      message: "Please enter a state name",
      path: ["state"],
    } );
  }
} );

export const NameSearchReservationFormSchema = z.object( {
  firstName: z.string().min( 1, "Please enter your first name" ),
  lastName: z.string().min( 1, "Please enter your last name" ),
  address,
  postalAddress,
  proposedBusinessName: z.string().min( 1, "Business name is required" ),
} );

export const AppointmentFormSchema = z.object( {
  registry: z.string().min( 1, "Please select a department" ),
  location: z.string().min( 1, "Please select a location" ),
  date: z.date( {
    required_error: "Please select a date",
  } ),
  time: z.string().min( 1, "Please select a time" ),
} );

export const ContactFormSchema = z.object( {
  email: z.string().email( "Please enter a valid email address" ),
  message: z.string().min( 3, "Please enter a message" ),
} );

const director = z.object( {
  name: z.string().min( 3, "Please enter a director" ),
  address: z.string().min( 3, "Please enter an address" ),
  occupation: z.string().min( 3, "Please enter an occupation" ),
  notice_date: z.date(),
} );

export const AddDirectorsSchema = director;
export const RemoveDirectorsSchema = director;