import { SelectedIndexContext, ShowPreviewContext } from "@components/form/dynamic-form";
import Container from "@components/layout/container";
import { Tab } from "@headlessui/react";
import { and, Categorization, categorizationHasCategory, getAjv, isVisible, LayoutProps, optionIs, RankedTester, rankWith, uiTypeIs } from "@jsonforms/core";
import { JsonFormsDispatch, useJsonForms, withJsonFormsLayoutProps } from "@jsonforms/react";
import useJoinClassNames from "@utils/joinClasses";
import { useContext, useEffect, useState } from "react";

export interface StepperLayoutProps extends LayoutProps
{
  data?: any;
}

function StepperLayout( props: StepperLayoutProps )
{
  const [ selectedIndex, setSelectedIndex ] = useState( 0 );
  
  const { showPreview, setShowPreview } = useContext( ShowPreviewContext );
  const { sectionIndex, setSectionIndex } = useContext( SelectedIndexContext );

  useEffect( ()=> {
    if( sectionIndex !== undefined ) setSelectedIndex( sectionIndex );
  }, [ sectionIndex ]);

  const joinClassNames = useJoinClassNames();

  const { data, path, schema, uischema } = props;
  const categorization = uischema as Categorization;

  const jsonFormState = useJsonForms();
  const ajv = getAjv({ jsonforms: { ...jsonFormState } });

  return (
    <Container>
      <div className="grid grid-rows-[auto_1fr_auto] w-full max-w-md h-screen max-h-[600px] mx-auto">
        <Tab.Group selectedIndex={ selectedIndex } onChange={ setSelectedIndex }>
          <Tab.List className="mb-6">
          { categorization.elements.map( ( category ) => (
              <Tab as="div"
                key={ category.label } 
                className={ ({ selected }) => 
                  joinClassNames( !selected ? "hidden" : "" , "flex items-center w-full h-14 text-sm text-left p-4 select-none" )}>
                <span className="dark:text-on-surface-dark text-on-surface-light font-semibold">{ category.label }</span>
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
        <div className="flex p-4 items-center justify-between">
          <button 
            disabled={ selectedIndex === 0 }
            className="flex w-fit h-fit rounded-full overflow-hidden outline outline-2 dark:outline-primary-dark outline-outline-light"
            onClick={ () => {
            if( selectedIndex > 0 ) setSelectedIndex( selectedIndex - 1 )
          }}>
            <span className="flex h-10 px-6 items-center justify-center text-sm dark:text-secondary-dark text-secondary-light font-medium">Back</span>
          </button>

          <button 
            className={
              joinClassNames( `${ selectedIndex === categorization.elements.length - 1 ? "hidden" : "" }`, 
              "flex w-fit h-fit rounded-full overflow-hidden dark:bg-primary-dark dark:text-on-primary-dark bg-primary-container-light text-sm text-on-primary-container-light font-medium" )}
            disabled={ selectedIndex === categorization.elements.length - 1 }
            onClick={ () => {
              if( selectedIndex < categorization.elements.length - 1 ) setSelectedIndex( selectedIndex + 1 )
            }}>
            <span className="flex h-10 px-6 items-center justify-center">Next</span>
          </button>

          <button 
            className={ 
              joinClassNames( `${ selectedIndex !== categorization.elements.length - 1 ? "hidden" : "" }`, 
                "flex w-fit h-fit rounded-full overflow-hidden text-sm dark:bg-primary-dark dark:text-on-primary-dark text-on-primary-container-light bg-primary-container-light font-medium" )}
            onClick={ () => {
              setShowPreview( true );
              setSectionIndex( undefined );
            }}>
            <span className="flex h-10 px-6 items-center justify-center">Review and Submit</span>
          </button>
        </div>
      </div>
    </Container>
  );
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