import { ArrayControlProps, isObjectArrayControl, RankedTester, rankWith } from "@jsonforms/core";
import { withJsonFormsArrayControlProps } from "@jsonforms/react";
import ArrayControl from "@components/form/array-control";

interface ArrayControlRendererProps extends ArrayControlProps {
  handleChange?: ( path: string, value: any ) => void;
}

function ArrayControlRenderer({ 
  data, 
  id, 
  label, 
  path,
  addItem, 
  removeItems,
  errors,
  enabled,
  visible,
  uischema,
  schema,
  rootSchema,
  handleChange }: ArrayControlRendererProps ) {
  return (
    <ArrayControl
      data={ data }
      id={ id }
      label={ label }
      path={ path }
      addItem={ addItem }
      removeItems={ removeItems }
      errors={ errors }
      enabled={ enabled }
      visible={ visible }
      uischema={ uischema }
      schema={ schema }
      rootSchema={ rootSchema }
      handleChange={ handleChange } />
  )
}

export const ArrayControlRendererTester: RankedTester = rankWith(20, isObjectArrayControl );

export default withJsonFormsArrayControlProps( ArrayControlRenderer )