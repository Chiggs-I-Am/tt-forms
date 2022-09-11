import { ActionCodeSettings, browserSessionPersistence, getAdditionalUserInfo, getIdToken, GoogleAuthProvider, onAuthStateChanged, sendSignInLinkToEmail, setPersistence, signInWithPopup, UserCredential } from "firebase/auth";
import { getFirebase } from "./firebaseApp";
import { createUserSession } from "./firestore";

const { auth } = getFirebase();

export function onAuth( callback: Function )
{
  return onAuthStateChanged( auth, ( user ) => {
    callback( user );
  })
}

export async function signInWithGoogle() 
{
  const provider = new GoogleAuthProvider();

  await setPersistence( auth, browserSessionPersistence );

  const userCredential = await signInWithPopup( auth, provider );

  const idToken = await getIdToken( userCredential.user )
  createUserSession( idToken, userCredential.user.uid );

  return userCredential;
}

export function additionalUserInfo( userCredential: UserCredential )
{
  let userInfo = getAdditionalUserInfo( userCredential );

  return userInfo;
}

const actionCodeSettings: ActionCodeSettings = {
  // URL to redirect back to
  url: "localhost:3000", // ? window.location.href
  handleCodeInApp: true,
};

export async function signInWithEmail( email: string )
{
  try { 
    await sendSignInLinkToEmail( auth, email, actionCodeSettings );
    window.localStorage.setItem( "emailForSignIn", email );
  }
  catch( error: any ) {
    console.log( error.code, error.message );
  }
}