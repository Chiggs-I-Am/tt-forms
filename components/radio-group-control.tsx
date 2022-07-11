import { and, ControlProps, isOneOfEnumControl, optionIs, OwnPropsOfEnum, RankedTester, rankWith } from "@jsonforms/core";
import { withJsonFormsOneOfEnumProps } from "@jsonforms/react";
import RadioButtonGroup from "./radio-button-group";

interface RadioGroupControlProps extends ControlProps, OwnPropsOfEnum
{
  data: any;
}


function RadioGroupControl( props: RadioGroupControlProps )
{
  const { path, handleChange, options, visible, label } = props;

  return (
    <div hidden={ !visible }>
      <h3 className="text-sm">{ label }</h3>
      <RadioButtonGroup options={ options } onChange={ ( value ) => { handleChange( path, value ) }} />
    </div>
  );
}

export const RadioGroupControlTester: RankedTester = rankWith(
  5,
  and( isOneOfEnumControl, optionIs("format", "radio" ) )
);

export default withJsonFormsOneOfEnumProps( RadioGroupControl );