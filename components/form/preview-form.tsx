import { Dialog, Transition } from "@headlessui/react";
import { PencilIcon } from "@heroicons/react/solid";
import { lowerCase, startCase, upperFirst } from "lodash";
import { Fragment, useCallback, useState } from 'react';

interface PreviewFormProps
{
  open: boolean;
  title: string | undefined;
  description?: string;
  formData: any;
  submitForm: () => void;
  gotoSection: ( index: number ) => void;
  onCloseDialog?: () => void;
}

export default function PreviewForm({ open, formData, title, description, submitForm, gotoSection, onCloseDialog }: PreviewFormProps ) 
{
  const [ isOpen, setIsOpen ] = useState( open );

  const handleOnClick = useCallback( () => {
    if( submitForm ) submitForm();

    setIsOpen( false );
  }, [ submitForm ]);

  const handleCloseDialog = useCallback( () => {
      setIsOpen( false );
      if( onCloseDialog ) onCloseDialog();
    }, [ onCloseDialog ]);

  const editSection = useCallback( ( index: number ) => {
    gotoSection( index );
    handleCloseDialog();
  }, [ gotoSection, handleCloseDialog ]);

  return (
    <>
      <Transition appear as={ Fragment } show={ isOpen }>
        <Dialog as="div" className="relative z-50" onClose={ handleCloseDialog }>

          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            as={ Fragment }>
              {/* Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-25" aria-hidden="true" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="grid min-h-full place-items-center text-center">

              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95">

                <Dialog.Panel className="w-full max-w-sm space-y-4 overflow-hidden rounded-xl bg-white p-4 text-left align-middle shadow-xl transform transition-all sm:max-w-md sm:space-y-6 sm:p-6">
                {/* <Dialog.Panel className="w-full h-full space-y-4 p-4 max-w-sm overflow-hidden transform transition-all bg-surface-light text-left align-middle sm:p-6 sm:rounded-xl sm:shadow-lg"> */}
                  
                  <Dialog.Title className="flex items-center">
                    <h3  className="text-sm font-bold">{ startCase( title ) ?? "Review and Submit" }</h3>              
                  </Dialog.Title>
                  
                  <Dialog.Description>
                    <span className="text-sm font-medium">{ description }</span>
                  </Dialog.Description>
                  
                  <div className="grid gap-2">
                    { formData ? Object.keys( formData ).map( ( key: string, index: number ) => {
                      let value = formData[ key ];                
                      let name = upperFirst( lowerCase( key ) );

                      return (
                        <>
                          <div className="pb-1 outline outline-1 outline-outline-light rounded-lg">
                          <div className="flex px-4 py-2 items-center justify-between text-sm font-medium bg-secondary-container-light text-on-secondary-container-light">
                            <h3>{ name }</h3>
                            
                              <button 
                                className="p-1 rounded-full bg-on-secondary-container-light text-secondary-container-light"
                                onClick={ () => editSection( index ) }>
                                <PencilIcon className="w-4 h-4" />
                              </button>
                          </div>
                          { typeof value === "object"
                              ? Object.keys( value ).map( ( valueKey: string ) => {
                                  let objValue = value[ valueKey ];

                                  let name = upperFirst( lowerCase( valueKey ) );

                                  return (
                                    <ul key={ valueKey } className="px-4 py-1">
                                      <li className="text-xs">
                                        <span className="font-medium">{ `${ name }` }</span>
                                        { 
                                          Array.isArray( objValue ) 
                                            ? objValue.map( ( item: any, index: number ) => {
                                                // get object value key
                                                let itemKey = Object.keys( item )[ 0 ];
                                                // get value by name
                                                let itemValue = item[ itemKey ];

                                                return (
                                                  <div key={ index }>
                                                    <div>{ `${ itemValue }` }</div>
                                                  </div>
                                                );
                                              })
                                            : <span>{ `: ${ objValue }` }</span> 
                                        }
                                      </li>
                                    </ul>
                                  );
                                })
                              : <div className="px-4 py-1 text-xs">{ value }</div>
                          }
                          </div>
                        </>
                      )
                    }) : null }
                  </div>
                  <div className="flex w-full justify-between">
                    <button 
                      className="h-10 px-6 rounded-full text-sm text-on-surface-light font-medium bg-surface-light border-2 border-solid border-on-surface-variant-light"
                      onClick={ handleCloseDialog }>
                        Cancel
                    </button>
                    <button 
                      className="px-6 text-sm text-center font-medium rounded-full shadow-lg bg-primary-container-light text-on-primary-container-light"
                      onClick={ handleOnClick }>
                        Submit
                    </button>
                  </div>
                </Dialog.Panel>
                
              </Transition.Child>
            </div>
          </div>

        </Dialog>
      </Transition>
    </>
  )
}
