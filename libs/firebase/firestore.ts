import { User } from "firebase/auth";
import { addDoc, collection, doc, DocumentSnapshot, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { getFirebase } from "./firebaseApp";

export const { firestore } = getFirebase();

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

export async function createUserSession( sessionToken: string, userID: string ) 
{
  const sessionCollectionRef = collection( firestore, "sessions" );

  const addDaysToCurrentDate = ( days: number ) => {
    const currentDate = new Date();
    const addDaysToDate = new Date( new Date( currentDate ).setDate( currentDate.getDate() + days ) );
    const options: Intl.DateTimeFormatOptions = { dateStyle: "full", timeStyle: "long", hour12: true };
    return new Intl.DateTimeFormat("en-GB", options ).format( addDaysToDate );
  };
  
  await addDoc( sessionCollectionRef, {
    expires: addDaysToCurrentDate( 5 ),
    sessionToken,
    userID
  });
}

export function getDateFromTimestamp( time: Timestamp )
{
  return new Date( time.toMillis() ).toDateString();
}