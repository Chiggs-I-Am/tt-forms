import { Transition } from "@headlessui/react";
import { XIcon } from "@heroicons/react/solid";
import { Fragment, ReactNode, useState } from 'react';

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

  return (
    <Transition appear as={ Fragment } show={ isOpen }>
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
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-x-full"
              enterTo="opacity-100 translate-x-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-x-0"
              leaveTo="translate-x-full opacity-0"
              as={ Fragment }>
                <div className="flex flex-col gap-6 w-full max-w-sm h-full bg-surface-light">
                  <div className="flex w-full h-14 p-4 justify-between items-center">
                    <h3 className="block text-sm font-bold text-on-surface-light">{ name }</h3>
                    <button 
                      className="text-on-surface-light"
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
