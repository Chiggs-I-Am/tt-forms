import Sidebar from "@components/layout/sidebar";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Components/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
  }
} as ComponentMeta<typeof Sidebar>;

const Template: ComponentStory<typeof Sidebar> = (args: any) => <Sidebar { ...args } />;

export const Sidenav = Template.bind({});
Sidenav.args = {
  open: true,
  name: "Company registry",
  handleOnClick: () => console.log("close"),
  children: (
    <>
      <div className="w-full h-fit rounded-xl shadow-md overflow-hidden bg-primary-container-light sm:max-w-sm">
        <figure className="flex min-h-[86px] p-4 justify-between items-center gap-2 select-none cursor-pointer">
          <figcaption className="flex flex-col items-start">
            <p className="text-sm text-on-primary-container-light font-bold">Name search reservation</p>
            <p className="text-sm text-on-primary-container-light font-medium">Fee: $25</p>
          </figcaption>
        </figure>
      </div>

      <div className="w-full rounded-xl shadow-md overflow-hidden bg-primary-container-light sm:max-w-sm">
        <figure className="flex min-h-[86px] p-4 justify-between items-center gap-2 select-none cursor-pointer">
          <figcaption className="flex flex-col items-start">
            <p className="text-sm text-on-primary-container-light font-bold">Name search reservation</p>
            <p className="text-sm text-on-primary-container-light font-medium">Fee: $25</p>
          </figcaption>
        </figure>
      </div>
    </>
  )
};