import { apps, credential } from "firebase-admin";
import { App, getApp, initializeApp } from "firebase-admin/app";
import { DecodedIdToken, getAuth, UserRecord } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function createFirebaseAdminApp(): App | undefined
{
  if( apps.length <= 0 || !apps.length ) {
    let app = initializeApp({
      credential: credential.cert( process.env.GOOGLE_APPLICATION_CREDENTIALS as string ),
    });
    
    return app;
  }

  const app = getApp();
  return app;
}

export const firebaseAdmin = createFirebaseAdminApp();
export const authAdmin = getAuth( firebaseAdmin );
export const firestoreAdmin = getFirestore( firebaseAdmin );

export async function getUserRecordFromToken( idToken: string )
{
  let decodedIdToken: DecodedIdToken = await authAdmin.verifyIdToken( idToken, true);
  let userRecord: UserRecord = await authAdmin.getUser( decodedIdToken.uid );
  return userRecord;
}

export async function getUserInfoFromSessionCookie( sessionCookie: string )
{
  let decodedIdToken: DecodedIdToken = await authAdmin.verifySessionCookie( sessionCookie, true );
  
  return decodedIdToken;
}