"use client";

import { AppointmentFormSchema } from "@/libs/form/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, CheckIcon } from "@radix-ui/react-icons";
import * as RadioGroup from "@radix-ui/react-radio-group";
import
  {
    Button,
    Heading,
    Popover,
    Select,
    Separator,
    Text,
    Theme,
  } from "@radix-ui/themes";
import { Inter_Tight, Noto_Sans } from "next/font/google";
import { useState } from "react";
import { DayOfWeek } from "react-day-picker";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Calendar } from "./calendar";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./form/form";
import
  {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetTitle,
    SheetTrigger
  } from "./sheet";

const interTight = Inter_Tight({ subsets: ["latin"] });
const notoSans = Noto_Sans({ subsets: ["latin"] });

type Inputs = z.infer<typeof AppointmentFormSchema>;
type FieldName = keyof Inputs;

const appointmentTimes = [
  "8:00",
  "8:30",
  "9:00",
  "9:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
];

export default function AppointmentForm() {
  const [date, setDate] = useState<Date>();
  const [open, setOpen] = useState(false);
  const form = useForm<Inputs>({
    resolver: zodResolver(AppointmentFormSchema),
    defaultValues: {
      registry: "",
      date: undefined,
      time: "",
      location: "",
    },
  });

  const defaultMonth = new Date();
  const weekend: DayOfWeek = {
    dayOfWeek: [0, 6],
  };


  function onSubmit(data: Inputs) {
    const date = formatDate(data.date);
    const formData = { ...data, date };
    console.log(formData);
    setOpen(false);
    form.reset();
  }

  function formatDate(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    const dateTimeFormat = new Intl.DateTimeFormat("en-US", options);

    return dateTimeFormat.format(date);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="soft" size="3" className="justify-self-end">
            <CalendarIcon className="h-[18px] w-[18px]" />
            Schedule a visit
          </Button>
        </SheetTrigger>
        <Theme asChild>
          <SheetContent>
            <div className="grid place-content-center gap-2 px-4 pb-4 pt-8">
              <SheetTitle>Schedule a visit</SheetTitle>
              <SheetDescription>
                Choose a date and time from the options below.
              </SheetDescription>
            </div>
            <Separator size="4" decorative />
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Heading as="h3" size="1" weight="medium" align="center" className="pt-4">
                  Department and location
                </Heading>
                <FormField
                  control={form.control}
                  name="registry"
                  render={({ field }) => (
                    <div className="grid place-content-center pt-4">
                      <FormItem className="h-16">
                        <Select.Root
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          size="3"
                        >
                          <Select.Trigger
                            className="w-72"
                            placeholder="Select a department"
                            color="gray"
                          />
                          <Select.Content
                            position="popper"
                            className="z-[100]"
                            variant="soft"
                          >
                            <Select.Group>
                              <Select.Label>Registries</Select.Label>
                              <Select.Item value="company">Company</Select.Item>
                              <Select.Item value="civil">Civil</Select.Item>
                              <Select.Item value="land">Land</Select.Item>
                              <Select.Item value="digial">Digital</Select.Item>
                            </Select.Group>
                          </Select.Content>
                        </Select.Root>
                        <FormMessage className="px-4 font-medium text-red-9" />
                      </FormItem>
                    </div>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <div className="grid place-content-center py-4">
                      <FormItem className="h-16">
                        <Select.Root
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          size="3"
                        >
                          <Select.Trigger
                            className="w-72"
                            placeholder="Select a location"
                          />
                          <Select.Content
                            position="popper"
                            className="z-[100]"
                            variant="soft"
                          >
                            <Select.Group>
                              <Select.Label>Locations</Select.Label>
                              <Select.Item value="couva">Couva</Select.Item>
                              <Select.Item value="chaguanas">
                                Chaguanas
                              </Select.Item>
                              <Select.Item value="san fernando">
                                San Fernando
                              </Select.Item>
                              <Select.Item value="port of spain">
                                Port of Spain
                              </Select.Item>
                            </Select.Group>
                          </Select.Content>
                        </Select.Root>
                        <FormMessage className="px-4 font-medium text-red-9" />
                      </FormItem>
                    </div>
                  )}
                />
                <Separator size="4" decorative />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <div className="grid place-content-center gap-4 py-4">
                      <Heading as="h3" size="1" weight="medium" align="center">
                        Date and time
                      </Heading>
                      <FormItem className="m-auto h-16">
                        <FormControl>
                          <Popover.Root>
                            <Popover.Trigger className="w-72" placeholder="Date">
                              <Button variant="outline" size="3" color="gray" style={{ fontWeight: 400 }}>
                                {field.value ? (
                                  formatDate(field.value)
                                ) : (
                                  <span>Select a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-[18px] w-[18px]" />
                              </Button>
                            </Popover.Trigger>
                            <Popover.Content className="z-[100]">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                fixedWeeks
                              />
                            </Popover.Content>
                          </Popover.Root>
                        </FormControl>
                        <FormMessage className="px-4 font-medium text-red-9" />
                      </FormItem>
                      <div className="grid h-52 place-content-center gap-2 py-2">
                        <Text
                          as="p"
                          size="1"
                          weight="medium"
                          className="w-full text-start"
                        >
                          Select a time
                        </Text>
                        <FormField
                          control={form.control}
                          name="time"
                          render={({ field }) => (
                            <>
                              <FormItem>
                                <FormControl>
                                  <RadioGroup.Root
                                    className="flex max-w-[300px] flex-wrap gap-2"
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    {appointmentTimes.map((time, i) => (
                                      <FormControl key={time}>
                                        <RadioGroup.Item
                                          value={time}
                                          className="flex h-8 min-w-max items-center justify-center gap-2 rounded-lg border border-grayA-4 px-4 text-xs shadow-sm data-[state=checked]:pl-2 data-[state=checked]:transition-transform data-[state=checked]:dark:border-accent-6 data-[state=checked]:dark:bg-accent-4 data-[state=checked]:text-accent-11"
                                          id="r1"
                                        >
                                          <RadioGroup.Indicator asChild>
                                            <CheckIcon className="h-[18px] w-[18px] shrink-0" />
                                          </RadioGroup.Indicator>
                                          <span>{time}</span>
                                        </RadioGroup.Item>
                                      </FormControl>
                                    ))}
                                  </RadioGroup.Root>
                                </FormControl>
                                <FormMessage className="px-4 font-medium text-red-9" />
                              </FormItem>
                            </>
                          )}
                        />
                      </div>
                    </div>
                  )}
                />
                <Separator size="4" decorative />
                <SheetFooter className="p-4">
                  {/* <SheetClose asChild> */}
                    <Button variant="soft" size="3" type="submit">
                      Make a reservation
                    </Button>
                  {/* </SheetClose> */}
                </SheetFooter>
              </form>
            </Form>
          </SheetContent>
        </Theme>
      </Sheet>
    </>
  );
}
