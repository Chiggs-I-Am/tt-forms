import { ActionCodeSettings, browserSessionPersistence, getAdditionalUserInfo, getIdToken, GoogleAuthProvider, isSignInWithEmailLink, onAuthStateChanged, sendSignInLinkToEmail, setPersistence, signInWithEmailLink, signInWithPopup, UserCredential } from "firebase/auth";
import { NextRouter } from "next/router";
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


export async function signInWithEmail( email: string, url: string )
{
  const actionCodeSettings: ActionCodeSettings = {
    url,
    handleCodeInApp: true,
  };
  
  try { 
    await sendSignInLinkToEmail( auth, email, actionCodeSettings );
    window.localStorage.setItem( "emailForSignIn", email );
  }
  catch( error: any ) {
    console.log( error.code, error.message );
  }
}

export async function checkEmailSignIn( email: string, router: NextRouter )
{
  if( isSignInWithEmailLink( auth, window.location.href ) ) {
    if( !email ) {
      // prompt user for email address
      console.log( "Sign in again!" );
    }
    try {
      let userCredential = await signInWithEmailLink( auth, email!, window.location.href );

      let additionalInfo = additionalUserInfo( userCredential );
      if( additionalInfo?.isNewUser ) {
        router.push("/auth/create-username");
      }
      
      window.localStorage.removeItem( "emailForSignIn" );
    }
    catch( error: any ) {
      console.log( error.code, error.message );
    }
  }
}