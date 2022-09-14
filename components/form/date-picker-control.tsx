import { and, ControlProps, isDateControl, RankedTester, rankWith } from "@jsonforms/core";
import { withJsonFormsControlProps } from "@jsonforms/react";
import { useCallback } from "react";
import DatePicker from "./date-picker";

interface DatePickerControlProps extends ControlProps
{
  data: any;
}

function DatePickerControl( props: DatePickerControlProps ) 
{
  const { data, uischema, handleChange, path, label, visible } = props;

  const handleUpdateValue = useCallback( ( value: string ) => {
    handleChange( path, value )
  }, [ path, handleChange ]);

  return (
    <div className="relative grid" hidden={ !visible }>
      <DatePicker 
        label={ label }
        value={ data }
        minDate={ uischema.options?.minDate }
        maxDate={ uischema.options?.maxDate }
        updateValue={ ( value ) => handleUpdateValue( value ) }/>
    </div>
  )
}

export const DatePickerControlTester: RankedTester = rankWith(
  10,
  and( isDateControl )
);

export default withJsonFormsControlProps( DatePickerControl );