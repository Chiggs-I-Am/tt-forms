import { User } from "firebase/auth";
import { doc, DocumentSnapshot, getDoc, getFirestore, setDoc } from "firebase/firestore";
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
  let docRef = doc( firestore, collectionPath, docPath );
  let docSnapshot = await getDoc( docRef );
  return docSnapshot;
}

export function dataToJSON( doc: DocumentSnapshot ) {
  let data = doc.data();
  
  return {
    ...data,
    id: doc?.id,
    createAt: data?.createdAt.toMillis() ?? 0,
    updateAt: data?.updatedAt.toMillis() ?? 0,
  };
}

// add a new document in collection users
export async function createUser( user: User )
{
  let { displayName, email,  emailVerified, photoURL, uid } = user;

  try {
    await setDoc( doc( firestore, "users", user.uid ), {
      displayName,
      email,
      emailVerified,
      photoURL,
      uid
    });
  }
  catch( error: any ) {
    console.log( "Error code: ", error.code, "Error message: ", error.message );
  }
}