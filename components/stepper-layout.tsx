import Container from "@components/container";
import { Tab } from "@headlessui/react";
import { and, Categorization, categorizationHasCategory, getAjv, isVisible, LayoutProps, optionIs, RankedTester, rankWith, uiTypeIs } from "@jsonforms/core";
import { JsonFormsDispatch, useJsonForms, withJsonFormsLayoutProps } from "@jsonforms/react";
import useJoinClassNames from "@utils/joinClasses";
import { useState } from "react";

export interface StepperLayoutProps extends LayoutProps
{
  data?: any;
}

function StepperLayout( props: StepperLayoutProps )
{
  const [ selectedIndex, setSelectedIndex ] = useState( 0 );
  const [ showCategory, setShowCategory ] = useState( true );
  const joinClassNames = useJoinClassNames();

  const { data, path, schema, uischema } = props;
  const categorization = uischema as Categorization;

  const jsonFormState = useJsonForms();
  const ajv = getAjv({ jsonforms: { ...jsonFormState } });

  return (
    <Container>
      <div className="grid gap-5 grid-rows-[auto_1fr_auto] w-full max-w-md h-screen mx-auto">
        <Tab.Group selectedIndex={ selectedIndex } onChange={ setSelectedIndex }>
          <Tab.List>
          { categorization.elements.map( ( category ) => (
              <Tab
                key={ category.label } 
                className={ ({ selected }) => 
                  joinClassNames( !selected ? "hidden" : "" , "w-full h-10 text-sm text-left text-white px-4 py-2 bg-primary-light" )}>
                <span className="text-on-primary-light font-medium">{ category.label }</span>
              </Tab>
          ))}
          </Tab.List>
          <Tab.Panels>
            { categorization.elements.map( ( category ) => 
              isVisible( category, data, path, ajv ) && (
                <Tab.Panel as="ul" className="flex flex-col gap-4 px-4" key={ category.label }>
                  { category.elements.map( ( child, index ) => (
                    <li key={`${ path }-${ index }`}>
                      <JsonFormsDispatch
                        uischema={ child }
                        schema={ schema }
                        path={ path } />
                    </li>
                  ))}
                </Tab.Panel>
              )
            )}
          </Tab.Panels>
        </Tab.Group>
        <div className="flex py-4 justify-end space-x-2">
          <button 
            disabled={ selectedIndex === 0 }
            onClick={ () => {
            if( selectedIndex > 0 ) setSelectedIndex( selectedIndex - 1 )
          }}>Previous</button>

          <button 
            className="flex w-fit h-fit rounded-full overflow-hidden shadow-lg text-sm text-primary-light font-medium"
            disabled={ selectedIndex === categorization.elements.length - 1 }
            onClick={ () => {
              if( selectedIndex < categorization.elements.length - 1 ) setSelectedIndex( selectedIndex + 1 )
            }}>
            <span className="flex h-10 px-6 items-center justify-center">Next</span>
          </button>
        </div>
      </div>
    </Container>
  );
}

/* 
  TODO: make classNames a utility function
*/
function joinClassNames( ...classes: any )
{
  return classes.filter(Boolean).join(" ");
}

export default withJsonFormsLayoutProps( StepperLayout );

export const StepperLayoutTester: RankedTester = rankWith(
  3,
  and(
    uiTypeIs("Categorization"),
    categorizationHasCategory,
    optionIs("variant", "stepper")
  )
);