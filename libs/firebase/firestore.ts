import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { initializeFirebaseApp } from "./firebaseApp";

const firebaseApp = initializeFirebaseApp();
export const firestore = getFirestore( firebaseApp );

export async function createDocument( path: string, data: any )
{
  try {
    await setDoc( doc( firestore, "users", data.uid ), data );
    
    alert( `Document created at: users/${ data.uid}` );
  }
  catch( error: any ) {
    console.log( error.code, error.message );
  }
}

export async function getFirestoreDocument( collectionPath: string, docPath: string )
{
  let userDocRef = doc( firestore, collectionPath, docPath );
  let userDoc = await getDoc( userDocRef );
  return userDoc;
}