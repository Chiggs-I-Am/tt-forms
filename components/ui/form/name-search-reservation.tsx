"use client";

import { NameSearchReservationFormSchema } from "@/libs/form/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil2Icon } from "@radix-ui/react-icons";
import { Button, Card, IconButton, Select, TextField } from "@radix-ui/themes";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Progress } from "../progress";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { RadioGroup, RadioGroupItem } from "./radio-group";

type Inputs = z.infer<typeof NameSearchReservationFormSchema>;
type FieldName = keyof Inputs;

const steps: {
  id: string;
  title: string;
  header?: string;
  fields?: string[];
}[] = [
  {
    id: "Step 1",
    title: "Personal information",
    header: "Let's start with your name.",
    fields: ["firstName", "lastName"],
  },
  {
    id: "Step 2",
    title: "Address",
    fields: ["address.street", "address.city", "address.state"],
  },
  {
    id: "Step 3",
    title: "Postal address",
    fields: [
      "postalAddress.hasPostalAddress",
      "postalAddress.street",
      "postalAddress.city",
      "postalAddress.state",
    ],
  },
  {
    id: "Step 4",
    title: "Business name",
    fields: ["proposedBusinessName"],
  },
  {
    id: "Step 5",
    title: "Review",
  },
];

const provinces = [
  "Chaguanas",
  "Couva",
  "Diego Martin",
  "Mayaro",
  "Penal",
  "Princes Town",
  "Point Fortin",
  "Port of Spain",
];

export default function NameSearchReservation() {
  const [currentStep, setCurrentStep] = useState(0);
  const [previousStep, setPreviousStep] = useState(0);
  const [progress, setProgress] = useState(100 / steps.length);
  const [hasPostalAddress, setHasPostalAddress] = useState<string>();
  const router = useRouter();

  const delta = currentStep - previousStep;

  const form = useForm<Inputs>({
    resolver: zodResolver(NameSearchReservationFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      address: { street: "", city: "", state: "" },
      postalAddress: {
        hasPostalAddress: undefined,
        street: "",
        city: "",
        state: "",
      },
      proposedBusinessName: "",
    },
  });

  function handleChangeOption(
    value: string,
    onChange: (...event: string[]) => void,
  ) {
    onChange(value);
    setHasPostalAddress(value);

    if (value === "No") {
      form.resetField("postalAddress.state");
      form.resetField("postalAddress.city");
      form.resetField("postalAddress.street");
    }
  }

  function showPreviousItem() {
    if (currentStep > 0) {
      setPreviousStep(currentStep);
      setCurrentStep((step) => step - 1);
      setProgress((value) => value - 100 / steps.length);
    }
  }

  async function showNextItem() {
    const fields = steps[currentStep].fields as FieldName[];
    const isFieldValid = await form.trigger(fields, { shouldFocus: true });

    if (!isFieldValid) return;

    if (currentStep < steps.length - 1) {
      setPreviousStep(currentStep);
      setCurrentStep((step) => step + 1);
      setProgress((value) => value + 100 / steps.length);
    }

    if (currentStep === steps.length - 1) {
      await form.handleSubmit(submitForm)();
    }
  }

  function gotoStep(step: number) {
    setCurrentStep(step);
    setProgress((100 / steps.length) * (step + 1));
  }

  function submitForm(data: Inputs) {
    console.log(data);
    // submit form data

    // show form submit success

    // form.reset();

    // router.push("/");
  }

  return (
    <div className="grid h-full w-full grid-rows-[auto,1fr,auto] gap-4 @container/form">
      <nav className="grid h-12 items-center">
        <h2 className="sr-only">Steps</h2>
        <div>
          <p className="text-xs font-medium text-gray-8">
            {currentStep + 1}/{steps.length} - {steps[currentStep].title}
          </p>
          <Progress value={progress} className="w-full" />
        </div>
      </nav>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submitForm)}>
          {/* Personal Information */}
          {currentStep === 0 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="grid w-full grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4"
            >
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="h-16">
                    <FormControl>
                      <TextField.Root size="3" radius="small">
                        <TextField.Input placeholder="First name" {...field} />
                      </TextField.Root>
                    </FormControl>
                    <FormMessage className="px-3 font-medium text-red-9" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="h-16">
                    <FormControl>
                      <TextField.Root size="3" radius="small">
                        <TextField.Input placeholder="Last name" {...field} />
                      </TextField.Root>
                    </FormControl>
                    <FormMessage className="px-3 font-medium text-red-9" />
                  </FormItem>
                )}
              />
            </motion.div>
          )}
          {/* Address */}
          {currentStep === 1 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="grid w-full grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4"
            >
              {/* Address - Street */}
              <FormField
                control={form.control}
                name="address.street"
                render={({ field }) => (
                  <FormItem className="h-16">
                    <FormControl>
                      <TextField.Root size="3" radius="small">
                        <TextField.Input placeholder="Street" {...field} />
                      </TextField.Root>
                    </FormControl>
                    <FormMessage className="px-3 font-medium text-red-9" />
                  </FormItem>
                )}
              />
              {/* Address - City */}
              <FormField
                control={form.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem className="h-16">
                    <FormControl>
                      <TextField.Root size="3" radius="small">
                        <TextField.Input placeholder="City" {...field} />
                      </TextField.Root>
                    </FormControl>
                    <FormMessage className="px-3 font-medium text-red-9" />
                  </FormItem>
                )}
              />
              {/* Address - State/Province */}
              <FormField
                control={form.control}
                name="address.state"
                render={({ field }) => (
                  <FormItem className="grid">
                    <Select.Root
                      size="3"
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <Select.Trigger
                          radius="small"
                          placeholder="Select a state/province"
                        />
                      </FormControl>
                      <Select.Content variant="soft">
                        {provinces.map((province, index) => (
                          <Select.Item key={province} value={province}>
                            {province}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    <FormMessage className="px-4 font-medium text-red-9" />
                  </FormItem>
                )}
              />
            </motion.div>
          )}
          {/* Postal Address  */}
          {currentStep === 2 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="grid w-full grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4"
            >
              <FormField
                control={form.control}
                name="postalAddress.hasPostalAddress"
                render={({ field }) => (
                  <>
                    <FormItem className="col-span-full grid">
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            handleChangeOption(value, field.onChange);
                          }}
                          defaultValue={field.value}
                          className="flex flex-col"
                        >
                          <FormItem className="flex h-10 items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Yes" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Yes, I have a postal address.
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex h-10 items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="No" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              No, I dont have a postal address.
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className="px-7 font-medium text-red-9" />
                    </FormItem>
                  </>
                )}
              />
              <AnimatePresence>
                {hasPostalAddress === "Yes" ? (
                  <motion.div
                    initial={{ y: "50%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      duration: 0.3,
                      ease: "easeInOut",
                      delay: 0.2,
                    }}
                    exit={{ y: "50%", opacity: 0 }}
                    className="col-span-full grid w-full grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4"
                  >
                    <FormField
                      control={form.control}
                      name="postalAddress.street"
                      render={({ field }) => (
                        <FormItem className="h-16">
                          <FormControl>
                            <TextField.Root size="3" radius="small">
                              <TextField.Input
                                placeholder="Street"
                                {...field}
                              />
                            </TextField.Root>
                          </FormControl>
                          <FormMessage className="px-3 font-medium text-red-9" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postalAddress.city"
                      render={({ field }) => (
                        <FormItem className="h-16">
                          <FormControl>
                            <TextField.Root size="3" radius="small">
                              <TextField.Input placeholder="City" {...field} />
                            </TextField.Root>
                          </FormControl>
                          <FormMessage className="px-3 font-medium text-red-9" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postalAddress.state"
                      render={({ field }) => (
                        <>
                          <FormItem className="grid h-16">
                            <Select.Root
                              size="3"
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <Select.Trigger
                                  radius="small"
                                  placeholder="Select a state/province"
                                />
                              </FormControl>
                              <Select.Content variant="soft">
                                {provinces.map((province, index) => (
                                  <Select.Item key={province} value={province}>
                                    {province}
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select.Root>
                            <FormMessage className="px-3 font-medium text-red-9" />
                          </FormItem>
                        </>
                      )}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          )}
          {/* Proposed Business names */}
          {currentStep === 3 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="grid w-full grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 sm:grid-flow-col"
            >
              <FormField
                control={form.control}
                name="proposedBusinessName"
                render={({ field }) => (
                  <>
                    <TextField.Root size="3" radius="small">
                      <TextField.Input
                        placeholder="Proposed business name"
                        {...field}
                      />
                    </TextField.Root>
                  </>
                )}
              />
            </motion.div>
          )}
          {/* Review and submit */}
          {currentStep === 4 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Card>
                <div className="grid w-full gap-4">
                  <h2 className="text-balance text-center font-medium">
                    Name search reservation details
                  </h2>
                  <div className="grid w-full">
                    <h3 className="px-4 text-xs text-grayA-8">Name</h3>
                    <div className="flex h-12 w-full items-center justify-between rounded-lg border border-grayA-4 px-4">
                      <div className="text-grayA-11">
                        <p>
                          {form.getValues("firstName")}{" "}
                          {form.getValues("lastName")}
                        </p>
                      </div>
                      <IconButton
                        variant="ghost"
                        color="gray"
                        onClick={() => {
                          gotoStep(0);
                        }}
                      >
                        <Pencil2Icon className="h-4 w-4 justify-self-end" />
                      </IconButton>
                    </div>
                  </div>
                  <div className="grid w-full">
                    <h3 className="px-4 text-xs text-grayA-8">Address</h3>
                    <div className="flex min-h-12 w-full items-center justify-between rounded-lg border border-grayA-4 px-4 py-2 text-sm">
                      <p className="text-balance text-sm text-grayA-11">
                        {form.getValues("address.street")},{" "}
                        {form.getValues("address.city")},{" "}
                        {form.getValues("address.state")}
                      </p>
                      <IconButton
                        variant="ghost"
                        color="gray"
                        onClick={() => {
                          gotoStep(1);
                        }}
                      >
                        <Pencil2Icon className="h-4 w-4 justify-self-end" />
                      </IconButton>
                    </div>
                  </div>
                  {hasPostalAddress === "Yes" && (
                    <div className="grid w-full">
                      <h3 className="px-4 text-xs text-grayA-8">
                        Postal address
                      </h3>
                      <div className="flex min-h-12 w-full items-center justify-between text-balance rounded-lg border border-grayA-4 px-4 py-2 text-sm">
                        <p className="text-sm text-grayA-11">
                          {form.getValues("postalAddress.street")},{" "}
                          {form.getValues("postalAddress.city")},{" "}
                          {form.getValues("postalAddress.state")}
                        </p>
                        <IconButton
                          variant="ghost"
                          color="gray"
                          onClick={() => {
                            gotoStep(2);
                          }}
                        >
                          <Pencil2Icon className="h-4 w-4 justify-self-end" />
                        </IconButton>
                      </div>
                    </div>
                  )}
                  <div className="grid w-full">
                    <h3 className="px-4 text-xs text-grayA-8">
                      Proposed business name
                    </h3>
                    <div className="flex min-h-12 w-full items-center justify-between text-balance rounded-lg border border-grayA-4 px-4 py-2 text-sm">
                      <p className="text-sm text-grayA-11">
                        {form.getValues("proposedBusinessName")}
                      </p>
                      <IconButton
                        variant="ghost"
                        color="gray"
                        onClick={() => {
                          gotoStep(3);
                        }}
                      >
                        <Pencil2Icon className="h-4 w-4 justify-self-end" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </form>
        <div className="flex h-16 w-full items-center justify-between">
          <Button
            variant="ghost"
            size="3"
            onClick={showPreviousItem}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button variant="soft" size="3" onClick={showNextItem}>
            {currentStep < steps.length - 1
              ? steps[currentStep + 1].title
              : "Submit"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
