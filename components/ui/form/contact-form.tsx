"use client";

import { ContactFormSchema } from "@/libs/form/schemas";
import { joinClasses } from "@/utils/joinClasses";
import { zodResolver } from "@hookform/resolvers/zod";
import
  {
    Button,
    Card,
    TextArea,
    TextFieldInput,
    TextFieldRoot,
  } from "@radix-ui/themes";
import { Inter_Tight, Nunito_Sans } from "next/font/google";
import { useForm } from "react-hook-form";
import * as z from "zod";
import
  {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage
  } from "./form";

const interTight = Inter_Tight({ subsets: ["latin"] });
const nunitoSans = Nunito_Sans({ subsets: ["latin"] });

type Inputs = z.infer<typeof ContactFormSchema>;
type FieldName = keyof Inputs;

export default function ContactForm() {
  const form = useForm<Inputs>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: {
      email: "",
      message: "",
    },
  });

  function onSubmit(data: Inputs) {
    console.log(data);
    form.reset();
  }

  return (
    <Card variant="surface">
      <div className="grid w-full h-full justify-items-center">
        <div className="grid w-[min(100%,360px)] grid-rows-[auto,auto,1fr] gap-4">
          <h3
            className={joinClasses(
              interTight.className,
              "text-2xl",
            )}
          >
            Need to know more?
          </h3>

          <div className="grid gap-1 text-xs auto-rows-min">
            <p
              className={joinClasses(
                nunitoSans.className,
                "flex items-center gap-2",
              )}
            >
              <span className="material-symbols-outlined">call</span> (868)
              868-8688
            </p>
            <p
              className={joinClasses(
                nunitoSans,
                "flex items-center gap-2",
              )}
            >
              <span className="material-symbols-outlined">mail</span>{" "}
              info@tt-forms.com
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-rows-[auto,auto,1fr] gap-2 pb-1">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <div className="h-[70px]">
                    <FormItem>
                      <FormControl>
                        <TextFieldRoot>
                          <TextFieldInput
                            size="3"
                            placeholder="Enter email"
                            radius="medium"
                            {...field}
                          />
                        </TextFieldRoot>
                      </FormControl>
                      {form.formState.errors.email ? (
                        <FormMessage className="px-3 font-medium text-red-9" />
                      ) : 
                        null
                      }
                    </FormItem>
                  </div>
                )}
              />
              {/* Message */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <>
                    <FormItem className="h-24">
                      <FormControl>
                        <TextArea placeholder="Enter email" {...field} />
                      </FormControl>
                      {form.formState.errors ? (
                        <FormMessage className="pl-2 font-medium text-red-9" />
                      ) : null}
                    </FormItem>
                  </>
                )}
              />
              <div className="grid w-full self-end max-w-[248px] justify-self-center">
                <Button variant="ghost" size="3" className="font-medium">
                  Send message
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Card>
  );
}
