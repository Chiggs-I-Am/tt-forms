import { AddDirectorsSchema, RemoveDirectorsSchema } from "@/libs/form/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, TrashIcon } from "@radix-ui/react-icons";
import {
  Button,
  Dialog,
  Heading,
  IconButton,
  Popover,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Calendar } from "../calendar";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./form";

type AddDirectorInputs = z.infer<typeof AddDirectorsSchema>;
type AddDirectorFieldName = keyof AddDirectorInputs;

type RemoveDirectorInputs = z.infer<typeof RemoveDirectorsSchema>;
type RemoveDirectorFieldName = keyof RemoveDirectorInputs;

interface DirectorsProps {
  add: AddDirectorInputs[];
  remove: RemoveDirectorInputs[];
}

export default function NoticeOfDirectors() {
  const [openDialog, setOpenDialog] = useState(false);

  const [addDirector, setAddDirector] = useState(false);
  const [addDirectorFormData, setAddDirectorFormData] = useState<
    AddDirectorInputs[]
  >([] as AddDirectorInputs[]);
  const [removeDirectorFormData, setRemoveDirectorFormData] = useState<
    RemoveDirectorInputs[]
  >([] as RemoveDirectorInputs[]);

  const addDirectorForm = useForm<AddDirectorInputs>({
    resolver: zodResolver(AddDirectorsSchema),
    defaultValues: {
      notice_date: undefined,
      name: "",
      occupation: "",
      address: "",
    },
  });

  const removeDirectorForm = useForm<RemoveDirectorInputs>({
    resolver: zodResolver(AddDirectorsSchema),
    defaultValues: {
      notice_date: undefined,
      name: "",
      address: "",
      occupation: "",
    },
  });

  const defaultMonth = new Date();

  function formatDate(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    const dateTimeFormat = new Intl.DateTimeFormat("en-US", options);

    return dateTimeFormat.format(date);
  }

  function showAddDirectorForm() {
    setAddDirector(true);
    setOpenDialog((open) => !open);
  }

  function showRemoveDirectorForm() {
    setAddDirector(false);
    setOpenDialog((open) => !open);
  }

  async function validateAddDirectorForm() {
    const isFieldValid = await addDirectorForm.trigger();

    if (!isFieldValid) return;

    await addDirectorForm.handleSubmit(onSubmitAddDirector)();
  }

  async function validateRemoveDirectorForm() {
    const isFieldValid = await removeDirectorForm.trigger();

    if (!isFieldValid) return;

    await removeDirectorForm.handleSubmit(onSubmitRemoveDirector)();
  }

  function onSubmitAddDirector(data: AddDirectorInputs) {
    setAddDirectorFormData((prev) => [...prev, data]);
    setOpenDialog(false);
    addDirectorForm.reset();
  }

  function onSubmitRemoveDirector(data: RemoveDirectorInputs) {
    setRemoveDirectorFormData((prev) => [...prev, data]);
    setOpenDialog(false);
    removeDirectorForm.reset();
  }

  function submitDirectors() {
    const directors = {
      add: addDirectorFormData,
      remove: removeDirectorFormData,
    };

    console.log(directors);
  }

  function onCancel() {
    setOpenDialog(false);
    addDirectorForm.reset();
    removeDirectorForm.reset();
  }

  function onOpenChange(open: boolean) {
    setOpenDialog(open);
    addDirectorForm.reset();
    removeDirectorForm.reset();
  }

  return (
    <>
      <div className="grid gap-2">
        <Heading size="3">Manage directors</Heading>
        <Text as="p" size="1">
          Enter the name(s) to be added/removed
        </Text>
        <div className="grid grid-flow-col gap-4">
          <Button variant="outline" color="green" onClick={showAddDirectorForm}>
            Add director
          </Button>
          <Button variant="outline" onClick={showRemoveDirectorForm}>
            Remove director
          </Button>
        </div>
      </div>
      <Dialog.Root open={openDialog} onOpenChange={onOpenChange}>
        <Dialog.Content style={{ width: "480px" }}>
          <Dialog.Title>
            {addDirector ? "Add a director" : "Remove a director"}
          </Dialog.Title>
          <Dialog.Description></Dialog.Description>
          {addDirector ? (
            <Form {...addDirectorForm}>
              <form
                onSubmit={addDirectorForm.handleSubmit(onSubmitAddDirector)}
              >
                <div className="grid gap-4">
                  <FormField
                    control={addDirectorForm.control}
                    name="notice_date"
                    render={({ field }) => (
                      <FormItem className="h-[68px] w-full">
                        <FormControl>
                          <Popover.Root>
                            <Popover.Trigger className="w-full">
                              <Button
                                variant="outline"
                                size="3"
                                color="gray"
                                style={{ fontWeight: 400 }}
                              >
                                {field.value ? (
                                  formatDate(field.value)
                                ) : (
                                  <span>Select notice date</span>
                                )}
                                <CalendarIcon className="ml-auto h-[18px] w-[18px]" />
                              </Button>
                            </Popover.Trigger>
                            <Popover.Content className="z-[100]">
                              <Calendar
                                mode="single"
                                onDayClick={(event) => {
                                  console.log("close calendar");
                                }}
                                // selected={field.value}
                                onSelect={field.onChange}
                                fixedWeeks
                                defaultMonth={defaultMonth}
                                fromMonth={defaultMonth}
                              />
                            </Popover.Content>
                          </Popover.Root>
                        </FormControl>
                        <FormMessage className="px-3 text-red-9" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addDirectorForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="h-[68px]">
                        <FormControl>
                          <TextField.Root>
                            <TextField.Input
                              size="3"
                              placeholder="Director name"
                              {...field}
                            />
                          </TextField.Root>
                        </FormControl>
                        <FormMessage className="px-3 text-red-9" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addDirectorForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="h-[68px]">
                        <FormControl>
                          <TextField.Root>
                            <TextField.Input
                              size="3"
                              placeholder="Director address"
                              {...field}
                            />
                          </TextField.Root>
                        </FormControl>
                        <FormMessage className="px-3 text-red-9" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addDirectorForm.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem className="h-[68px]">
                        <FormControl>
                          <TextField.Root>
                            <TextField.Input
                              size="3"
                              placeholder="Occupation"
                              {...field}
                            />
                          </TextField.Root>
                        </FormControl>
                        <FormMessage className="px-3 text-red-9" />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          ) : (
            <Form {...removeDirectorForm}>
              <form
                onSubmit={removeDirectorForm.handleSubmit(
                  onSubmitRemoveDirector,
                )}
              >
                <div className="grid gap-4">
                  <FormField
                    control={removeDirectorForm.control}
                    name="notice_date"
                    render={({ field }) => (
                      <FormItem className="h-[68px] w-full">
                        <FormControl>
                          <Popover.Root>
                            <Popover.Trigger className="w-full">
                              <Button
                                variant="outline"
                                size="3"
                                color="gray"
                                style={{ fontWeight: 400 }}
                              >
                                {field.value ? (
                                  formatDate(field.value)
                                ) : (
                                  <span>Select notice date</span>
                                )}
                                <CalendarIcon className="ml-auto h-[18px] w-[18px]" />
                              </Button>
                            </Popover.Trigger>
                            <Popover.Content className="z-[100]">
                              <Calendar
                                mode="single"
                                // selected={field.value}
                                onSelect={field.onChange}
                                fixedWeeks
                                defaultMonth={defaultMonth}
                                fromMonth={defaultMonth}
                              />
                            </Popover.Content>
                          </Popover.Root>
                        </FormControl>
                        <FormMessage className="px-3 text-red-9" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={removeDirectorForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="h-[68px]">
                        <FormControl>
                          <TextField.Root>
                            <TextField.Input
                              size="3"
                              placeholder="Director name"
                              {...field}
                            />
                          </TextField.Root>
                        </FormControl>
                        <FormMessage className="px-3 text-red-9" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={removeDirectorForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="h-[68px]">
                        <FormControl>
                          <TextField.Root>
                            <TextField.Input
                              size="3"
                              placeholder="Director address"
                              {...field}
                            />
                          </TextField.Root>
                        </FormControl>
                        <FormMessage className="px-3 text-red-9" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={removeDirectorForm.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem className="h-[68px]">
                        <FormControl>
                          <TextField.Root>
                            <TextField.Input
                              size="3"
                              placeholder="Occupation"
                              {...field}
                            />
                          </TextField.Root>
                        </FormControl>
                        <FormMessage className="px-3 text-red-9" />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          )}
          <div className="flex h-14 w-full items-end justify-between">
            <Button variant="ghost" size="3" onClick={onCancel}>
              Cancel
            </Button>
            {addDirector ? (
              <Button
                variant="soft"
                color="green"
                size="3"
                onClick={validateAddDirectorForm}
              >
                Add director
              </Button>
            ) : (
              <Button
                variant="soft"
                size="3"
                onClick={validateRemoveDirectorForm}
              >
                Remove director
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Root>
      {addDirectorFormData.length > 0 || removeDirectorFormData.length > 0 ? (
        <>
          <table className="w-full text-sm">
            <thead className="sr-only">
              <tr>
                <th>Directors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grayA-4 border border-solid border-grayA-4">
              {addDirectorFormData.map((director, index) => (
                <tr key={director.name} className="bg-greenA-1">
                  <td className="flex items-center justify-between px-4 py-2">
                    <div>
                      <Heading as="h3" size="2">
                        {director.name}
                      </Heading>
                      <Text as="p" size="1">
                        {director.address}
                      </Text>
                      <Text as="p" size="1">
                        {director.occupation}
                      </Text>
                    </div>
                    <IconButton variant="ghost" color="red">
                      <TrashIcon className="h-4 w-4" />
                    </IconButton>
                  </td>
                </tr>
              ))}
              {removeDirectorFormData.map((director, index) => (
                <tr key={index} className="bg-redA-1">
                  <td className="flex items-center justify-between px-4 py-2">
                    <div>
                      <Heading as="h3" size="2">
                        {director.name}
                      </Heading>
                      <Text as="p" size="1">
                        {director.address}
                      </Text>
                      <Text as="p" size="1">
                        {director.occupation}
                      </Text>
                    </div>
                    <IconButton variant="ghost" color="red">
                      <TrashIcon className="h-4 w-4" />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex w-full justify-end">
            <Button variant="soft" size="3" onClick={submitDirectors}>
              Submit
            </Button>
          </div>
        </>
      ) : null}
    </>
  );
}
