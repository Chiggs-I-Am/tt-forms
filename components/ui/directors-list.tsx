"use client";

import { AddDirectorsSchema, RemoveDirectorsSchema } from "@/libs/form/schemas";
import { TrashIcon } from "@radix-ui/react-icons";
import { Button, Heading, IconButton, Text } from "@radix-ui/themes";
import React, { useEffect, useState } from "react";
import { z } from "zod";

type AddDirectorInputs = z.infer<typeof AddDirectorsSchema>;
type RemoveDirectorInputs = z.infer<typeof RemoveDirectorsSchema>;

interface DirectorsListProps {
  add: AddDirectorInputs[];
  remove: RemoveDirectorInputs[];
}

export default function DirectorsList({ add, remove }: DirectorsListProps) {
  const [addedDirector, setAddedDirector] = useState<AddDirectorInputs[]>(
    [] as AddDirectorInputs[],
  );
  const [removedDirector, setRemovedDirector] = useState<
    RemoveDirectorInputs[]
  >([] as RemoveDirectorInputs[]);

  useEffect(() => {
    if (add.length > 0) {
      setAddedDirector((prev) => [...prev, ...add]);
    }

    if (remove.length > 0) {
      setRemovedDirector((prev) => [...prev, ...remove]);
    }
  }, [add, remove]);

  function submitDirectors() {}

  return (
    <>
      <table className="w-[min(100%,288px)] text-sm">
        <thead className="sr-only">
          <tr>
            <th>Directors</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-grayA-4 border border-solid border-grayA-4">
          {addedDirector.map((director, index) => (
            <tr key={index} className="bg-greenA-1">
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
          {removedDirector.map((director, index) => (
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
  );
}
