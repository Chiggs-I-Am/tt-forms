import { createFirebaseApp } from "@libs/firebase/app";
import { doc, getFirestore, setDoc } from "firebase/firestore";

let app = createFirebaseApp();

export const firestore = getFirestore( app );

export async function createDocument( path: string, data: any )
{
  try {
    await setDoc( doc( firestore, "users", data.uid ), data );
    
    alert( `Document created at: users/${ data.uid}` );
  }
  catch( error: any ) {
    alert( JSON.stringify( error ) );
  }
}