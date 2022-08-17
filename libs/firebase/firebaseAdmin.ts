import { apps } from "firebase-admin";
import { App, applicationDefault, initializeApp } from "firebase-admin/app";
import { DecodedIdToken, getAuth, UserRecord } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { NextApiResponse } from "next";

export function createFirebaseAdminApp(): App | undefined
{
  if( apps.length <= 0 || !apps.length ) {
    let app = initializeApp({
      credential: applicationDefault(),
    });
    
    return app;
  }
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

export async function getUserRecordFromSessionCookie( sessionCookie: string )
{
  let decodedIdToken: DecodedIdToken = await authAdmin.verifySessionCookie( sessionCookie, true );
  
  return decodedIdToken;
}

export async function createSessionCookie( idToken: string, res: NextApiResponse )
{
  const expiresIn = 60 * 60 * 24 * 7; // 7 days

  const sessionCookie = await authAdmin.createSessionCookie( idToken, { expiresIn } );
  const options = { maxAge: expiresIn, httpOnly: true, secure: true };
  console.log( "sessionCookie", sessionCookie );
}