import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useCallback, useEffect, useState } from "react";

interface DialogProps
{
  open: boolean;
  title: string;
  description?: string;
  dialogBody?: string;
  dialogCancelText: string;
  dialogConfirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function TTFDialog({ open, title, description, dialogBody, dialogCancelText, dialogConfirmText, onConfirm, onCancel }: DialogProps ) 
{
  const [ isOpen, setIsOpen ] = useState( false );

  useEffect(() => {
    setIsOpen( open );
  }, [ open ]);

  const handleConfirm = useCallback( () => {
    onConfirm ? onConfirm() : setIsOpen( false );
  }, [ onConfirm ]);
  
  const handleCancel = useCallback( () => {
    onCancel ? onCancel() : setIsOpen( false );
  }, [ onCancel ]);

  return (
    <Transition appear show={ isOpen } as={ Fragment }>

      <Dialog as="div" className="relative z-50" onClose={ handleCancel }>
        {/* 
          Animte overlay opacity from 0 to 1 when dialog is open.
        */}
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

        <div className="fixed inset-0 grid place-items-center">

          <Dialog.Panel className="w-full space-y-4 p-6 max-w-sm rounded-xl shadow-md overflow-hidden transform transition-all dark:bg-surface-variant-dark bg-surface-light text-left align-middle">
            
            <Dialog.Title className="text-base font-semibold dark:text-error-dark text-on-surface-light">{ title }</Dialog.Title>
            
            <Dialog.Description className="dark:text-on-surface-variant-dark text-on-surface-light">{ description }</Dialog.Description>
            
            <p className="text-sm dark:text-on-surface-variant-dark text-on-surface-light">{ dialogBody }</p>

            <div className="inline-flex gap-4 w-full items-center justify-end">
              <button 
                className="h-10 px-6 rounded-full text-sm dark:bg-surface-variant-dark dark:text-on-error-container-dark dark:border-on-error-container-dark text-on-surface-light font-medium bg-surface-light border-2 border-solid border-on-surface-variant-light"
                onClick={ handleCancel }>{ dialogCancelText }</button>
              <button 
                onClick={ handleConfirm }
                className="h-10 px-6 rounded-full text-sm font-medium dark:bg-error-container-dark dark:text-on-error-container-dark text-on-error-container-light bg-error-container-light">{ dialogConfirmText }</button>
            </div>

          </Dialog.Panel> 
          
        </div>

      </Dialog>
    </Transition>
  );
}