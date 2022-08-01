import useJoinClassNames from "@utils/joinClasses";
import { useEffect, useState } from 'react';

interface HelperTextProps
{
  error: string;
}

export default function ValidationHelperText({ error }: HelperTextProps ) 
{
  const [ errorMessage, setErrorMessage ] = useState( "" );
  
  const joinClassNames = useJoinClassNames();

  useEffect( () => {
    if( error ) { setErrorMessage( error ); }
  }, [ error ]);

  return (
    <div className="text-error-light text-xs font-medium">
      { errorMessage }
    </div>
  )
}
