import { and, ControlProps, isOneOfEnumControl, optionIs, OwnPropsOfEnum, RankedTester, rankWith } from "@jsonforms/core";
import { withJsonFormsOneOfEnumProps } from "@jsonforms/react";
import { useCallback } from "react";
import RadioButtonGroup from "./radio-button-group";

interface RadioGroupControlProps extends ControlProps, OwnPropsOfEnum
{
  data: any;
}


function RadioGroupControl( props: RadioGroupControlProps )
{
  const { data, path, handleChange, options, visible, label } = props;

  const handleOnChange = useCallback( ( value: string ) => {
    handleChange( path, value );
  }, [ handleChange, path ]);

  return (
    <div className="grid gap-4" hidden={ !visible }>
      <h3 className="text-sm">{ label }</h3>
      <RadioButtonGroup data={ data } options={ options } onChange={ handleOnChange } />
    </div>
  );
}

export const RadioGroupControlTester: RankedTester = rankWith(
  5,
  and( isOneOfEnumControl, optionIs("format", "radio" ) )
);

export default withJsonFormsOneOfEnumProps( RadioGroupControl );