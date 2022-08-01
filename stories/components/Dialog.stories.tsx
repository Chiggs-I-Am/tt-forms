import TTFDialog from "@components/ttf-dialog";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default
{
  title: "Components/Dialog",
  component: TTFDialog,
} as ComponentMeta<typeof TTFDialog>;

const Template: ComponentStory<typeof TTFDialog> = ( args ) => ( <TTFDialog { ...args } /> );

export const Dialog = Template.bind({});
Dialog.args = {
  open: true,
  title: "Delete item",
  dialogBody: "Deleting this item will permanently delete it from the system. Are you sure you want to delete this item?",
  dialogCancelText: "Cancel",
  dialogConfirmText: "Delete",
  onConfirm: () => { },
  onCancel: () => { },
};