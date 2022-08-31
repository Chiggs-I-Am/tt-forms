import { Transition } from "@headlessui/react";
import { XIcon } from "@heroicons/react/solid";
import { Fragment, ReactNode, useLayoutEffect, useState } from 'react';

interface SidenavProps
{
  open: boolean;
  name: string;
  handleOnClick: () => void;
  children: ReactNode;
}

export default function Sidebar({ open, name, handleOnClick, children }: SidenavProps) 
{
  const [ isOpen, setIsOpen ] = useState( open );

  useLayoutEffect(() => {
    // get body overflow style
    const bodyOverflow = window.getComputedStyle( document.body ).overflow;
    // set overflow to hidden on mount
    document.body.style.overflow = "hidden";
    // set overflow to body overflow on unmount
    return () => {
      document.body.style.overflow = bodyOverflow
    };
  }, [ isOpen ])

  return (
    <Transition appear={ true } as={ Fragment } show={ isOpen }>
      <div className="relative z-50">

          <Transition.Child
            
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            as={ Fragment }>
              {/* Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-25" aria-hidden="true"/>
          </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="grid w-full h-full place-items-end ">
            <Transition.Child
              
              enter="transition ease-in-out duration-300 transform"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
              as={ Fragment }>
                <div className="flex flex-col gap-6 w-full max-w-sm h-full dark:bg-surface-dark bg-surface-light">
                  <div className="flex w-full h-14 p-4 justify-between items-center">
                    <h3 className="block text-sm font-bold dark:text-on-surface-dark text-on-surface-light">{ name }</h3>
                    <button 
                      className="dark:text-on-surface-dark text-on-surface-light"
                      onClick={ handleOnClick }>
                      <XIcon className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="grid gap-2 w-full px-4">{ children }</div>
                </div>
            </Transition.Child>
          </div>
        </div>
      </div>
    </Transition>
  )
}
