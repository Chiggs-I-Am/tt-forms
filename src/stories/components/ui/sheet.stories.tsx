import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

interface SheetStoryArgs {
  side: "right" | "left" | "top" | "bottom";
}

const meta = {
  title: "Components/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  parameters: {
    side: {
      control: { type: "radio" },
      options: ["right", "left", "top", "bottom"],
    }
  }
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Render() { 
    return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Sheet</Button>
      </SheetTrigger>
      <SheetContent side={"right"}>
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>
            This is a description for the sheet component. You can place any content here.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 p-4">Main content goes here.</div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outlined">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )},
};

export const Sides: Story = {
  render: function Render() {
    return (
    <div className="flex flex-wrap gap-4">
      {["right", "left", "top", "bottom"].map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button>{`Open ${side.charAt(0).toUpperCase() + side.slice(1)}`}</Button>
          </SheetTrigger>
          <SheetContent side={side as SheetStoryArgs["side"]}>
            <SheetHeader>
              <SheetTitle>{`Sheet from ${side}`}</SheetTitle>
              <SheetDescription>
                {`This sheet slides in from the ${side}.`}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 p-4">Content for {side} side.</div>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outlined">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  )},
};
