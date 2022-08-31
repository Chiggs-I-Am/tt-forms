import { ChevronLeftIcon, XIcon } from "@heroicons/react/solid";
import useJoinClassNames from "@utils/joinClasses";
import { useRouter } from "next/router";
import { ChangeEvent, useCallback, useId, useRef, useState } from "react";

interface AuthCardProps
{
  handleProviderSignIn: ( provider: string ) => void;
  handleEmailSignIn: ( email: string ) => void;
  handleCloseDialog?: () => void;
  showCloseIcon?: boolean;
}

export default function AuthCard({ handleProviderSignIn, handleEmailSignIn, handleCloseDialog, showCloseIcon = false }: AuthCardProps)
{
  const [showSignInOptions, setShowSignInOptions] = useState(true);
  const [showSignUpOptions, setShowSignUpOptions] = useState(true);
  
  const [showEmailSignIn, setShowEmailSignIn] = useState(false);
  const [showEmailSignUp, setShowEmailSignUp] = useState(false);

  const [inputValue, setInputValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [dirty, setDirty] = useState(false);

  const inputRef = useRef(null);
  const id = useId();
  const joinClassNames = useJoinClassNames();

  const router = useRouter();

  const handleClose = useCallback( () => {
    if( handleCloseDialog ) handleCloseDialog();
  }, [ handleCloseDialog ]);

  const handleSignInWithGoogle = useCallback(async () => {
    handleProviderSignIn("google");
  }, [ handleProviderSignIn ]);

  const handleSignInWithEmail = useCallback(async (email: string) => {
    handleEmailSignIn( email );
  }, [ handleEmailSignIn ]);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    let { value } = event.target;
    setInputValue(value);
  }, []);

  const handleFocus = useCallback(() => {
    setFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setFocused(false);

    if (inputValue.length > 0)
    {
      setDirty(true);
    }
  }, [inputValue]);

  function prefetchRoute( route: string ) {
    router.prefetch( route );
  }

  return (
    <div className="grid w-full h-full place-items-center">
      <div className="w-full max-w-sm rounded-xl shadow-md overflow-hidden dark:bg-primary-dark bg-primary-container-light">
        <div className="grid w-full h-full min-h-[320px]">
          <div className="relative grid w-full justify-center">
            <div className="w-[175px] h-fit p-4 text-center rounded-b-xl dark:bg-secondary-dark bg-primary-light">
              <span className="text-lg font-bold dark:text-on-primary-dark text-on-primary-light">{ showSignInOptions ? "Join TT Forms" : "Welcome back" }</span>
            </div>
            { showCloseIcon ? 
                <div className="absolute top-0 right-0 p-4">
                  <XIcon className="w-6 h-6 cursor-pointer" onClick={ handleClose } />
                </div>
              :
                null
            }
          </div>
          <div className="">
          { showSignInOptions ?
            <>
              { showSignUpOptions && !showEmailSignUp ?
                <div className="grid gap-6 w-full p-4">
                  <div className="grid gap-4 w-max place-self-center">
                    <button
                      onClick={ handleSignInWithGoogle }
                      className="h-10 px-6 rounded-full shadow-md text-sm font-medium bg-surface-light text-on-surface-light outline outline-2 outline-outline-light">
                      Sign up with Google
                    </button>

                    <button
                      onClick={ () => setShowEmailSignUp(true) }
                      onMouseOver={ () => prefetchRoute( "/auth/verify-request" ) }
                      className="h-10 px-6 rounded-full shadow-md text-sm font-medium bg-surface-light text-on-surface-light outline outline-2 outline-outline-light">
                      Sign up with email
                    </button>
                  </div>

                  <div className="place-self-center">
                    <p className="text-sm dark:text-on-primary-dark text-on-primary-container-light font-medium">Already have an account? <span className="font-bold text-tertiary-light select-none cursor-pointer" onClick={ () => setShowSignInOptions(false) }>Sign in</span>
                    </p>
                  </div>
                  
                </div>
                :
                <div className="grid gap-4 w-full p-4 place-items-center">
                  <div className="space-y-2">
                    <h3 className="text-base text-on-primary-container-light text-center font-medium">Sign up with email</h3>
                    <p className="text-sm text-on-primary-container-light text-center">Enter your email address to create an account.</p>
                  </div>
                  <div className="relative w-full">
                    <input
                      ref={ inputRef }
                      id={ `${ id }-input` }
                      type="text"
                      name="email"
                      placeholder="Enter value"
                      value={ inputValue }
                      onChange={ handleChange }
                      onFocus={ handleFocus }
                      onBlur={ handleBlur }
                      className="
                            peer h-14 w-full
                            border border-outline-dark
                            rounded-[4px]
                            text-sm dark:text-on-primary-dark 
                            placeholder-transparent
                            bg-inherit
                            focus:outline-none focus:border-2 focus:border-primary-container-dark"/>
                    <label className="absolute left-2 -top-5 text-xs dark:text-on-primary-dark text-on-primary-light peer-focus:font-semibold">Email</label>
                  </div>
                  <button
                    onClick={ () => handleSignInWithEmail(inputValue) }
                    className="w-fit h-10 px-6 rounded-full shadow-md text-sm font-medium bg-surface-light text-on-surface-light outline outline-2 outline-outline-light">
                    Sign up with email
                  </button>

                  <div className="flex items-center select-none cursor-pointer" onClick={ () => setShowEmailSignUp(false) }>
                    <ChevronLeftIcon className="w-4 h-4" />
                    <p className="text-sm text-on-primary-container-light font-medium">All other options</p>
                  </div>

                </div>
              }
            </>
            :
            <div>
              { showSignUpOptions && !showEmailSignIn ?
                <div className="grid gap-6 w-full p-4">
                  <div className="grid gap-4 w-max place-self-center">
                    <button
                      onClick={ handleSignInWithGoogle }
                      className="h-10 px-6 rounded-full shadow-md text-sm font-medium bg-surface-light text-on-surface-light outline outline-2 outline-outline-light">
                      Sign in with Google
                    </button>

                    <button
                      onClick={ () => setShowEmailSignIn(true) }                      
                      onMouseOver={ () => prefetchRoute( "/auth/verify-request" ) }
                      className="h-10 px-6 rounded-full shadow-md text-sm font-medium bg-surface-light text-on-surface-light outline outline-2 outline-outline-light">
                      Sign in with email
                    </button>
                  </div>

                  <div className="place-self-center">
                    <p className="text-sm text-on-primary-container-light font-medium">No Account? <span className="font-bold text-tertiary-light select-none cursor-pointer" onClick={ () => setShowSignInOptions(true) }>Create one</span>
                    </p>
                  </div>

                </div>
                :
                <div className="grid gap-4 w-full p-4 place-items-center">

                  <div className="space-y-2">
                    <h3 className="text-base text-on-primary-container-light font-medium text-center">Sign in with email</h3>
                    <p className="text-sm text-on-primary-container-light text-center">Enter the email address associated with your account, and we’ll send a magic link to your inbox.</p>
                  </div>

                  <div className="relative w-full">
                    <input
                      ref={ inputRef }
                      id={ `${ id }-input` }
                      type="text"
                      name="email"
                      placeholder="Enter value"
                      value={ inputValue }
                      onChange={ handleChange }
                      onFocus={ handleFocus }
                      onBlur={ handleBlur }
                      className="
                            peer h-14 w-full
                            border border-outline-light 
                            rounded-[4px]
                            text-sm dark:text-on-primary-dark
                            bg-inherit 
                            placeholder-transparent
                            focus:outline-none focus:border-2 focus:border-primary-container-dark"/>
                    <label className="absolute left-2 -top-5 text-xs dark:text-on-primary-dark text-on-primary-light peer-focus:font-semibold">Email</label>
                  </div>
                  <button
                    onClick={ () => handleSignInWithEmail(inputValue) }
                    className="w-fit h-10 px-6 rounded-full shadow-md text-sm font-medium bg-surface-light text-on-surface-light outline outline-2 outline-outline-light">
                    Sign in with email
                  </button>

                  <div className="flex items-center select-none cursor-pointer" onClick={ () => setShowEmailSignIn(false) }>
                    <ChevronLeftIcon className="w-4 h-4" />
                    <p className="text-sm text-on-primary-container-light font-medium">All other options</p>
                  </div>

                </div>
              }
            </div>
          }
          </div>
        </div>
      </div>
    </div>
  );
}