"use client"

import { CalendarIcon } from "@radix-ui/react-icons";
import { Button, Popover } from "@radix-ui/themes";
import { addMonths } from "date-fns";
import { DayOfWeek } from "react-day-picker";
import { Calendar } from "./calendar";
import { useState } from "react";

export default function DatePicker() 
{
  const [date, setDate] = useState<Date>();
  const defaultMonth = new Date();

  const weekend: DayOfWeek = {
    dayOfWeek: [0, 6],
  };

  return (
    <>
      <Popover.Root>
        <Popover.Trigger>
          <Button variant="soft">
            <CalendarIcon className="w-4 h-4" />
            Pick a date
          </Button>
        </Popover.Trigger>
      </Popover.Root>
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={ weekend }
        fixedWeeks
        defaultMonth={ defaultMonth }
        fromMonth={ defaultMonth }
        toMonth={ addMonths( defaultMonth, 1 ) } />
    </>
  )
}
